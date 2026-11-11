/**
 * 整屏吸附 + 平滑滚动（Lenis + GSAP ScrollTrigger）。首页在 CMS 里按地区开关（home → settings.fullpageSnap）。
 *
 * 效果：滚轮轻轻一拨，当前这一屏被缓缓带到下一屏并准确停住；比一屏高的区块里可以自由（平滑）滚动，
 * 滚到它的尽头后再拨一下才进入下一屏。
 *
 * 分工：Lenis 负责平滑滚动与带缓动的定位；ScrollTrigger 负责随滚动推进的画面（首屏内容随离场上移淡出、
 * 各区块标题进场）。吸附用 Lenis 的 scrollTo 而不是 ScrollTrigger 自带的 snap——后者自己改滚动位置，会和 Lenis 抢。
 *
 * 只在用鼠标/触控板的宽屏设备上启用：触屏本身的惯性滚动更自然；系统设置了「减少动态效果」时也不启用。
 * 两个库都在启用时才加载，不进其他页面的首屏脚本。返回清理函数。
 */
export async function startFullpageSnap(root: HTMLElement): Promise<() => void> {
  const usable = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!usable) return () => {};

  const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([import("lenis"), import("gsap"), import("gsap/ScrollTrigger"), import("lenis/dist/lenis.css")]);
  gsap.registerPlugin(ScrollTrigger);

  /** 吸附点：每个区块，加上页脚 */
  const screens = () => [...root.querySelectorAll<HTMLElement>("main > section"), ...root.querySelectorAll<HTMLElement>("footer")];
  /** 比视口高出这个比例以内的区块算「一屏」，整屏吸附；更高的在内部自由滚动 */
  const SCREEN_RATIO = 1.12;
  /** 位置判断的容差（像素） */
  const EDGE = 8;

  let animating = false;
  // 触控板一次拨动后会持续发出逐渐变小的惯性事件；吸附完成后要等到新的一次拨动才再响应
  let armed = true;
  let lastAt = 0;
  let lastSize = 0;

  /** 这次拨动应该吸附到哪里；返回 null 表示不吸附，交给平滑滚动 */
  function snapTarget(direction: 1 | -1): number | null {
    const y = window.scrollY;
    const viewport = window.innerHeight;
    const limit = document.documentElement.scrollHeight - viewport;
    const slack = viewport * (SCREEN_RATIO - 1);
    const boxes = screens().map((element, i) => {
      // 第一个区块上方可能有几像素的导航偏移，统一从页面顶部算起
      const top = i === 0 ? 0 : element.getBoundingClientRect().top + y;
      const bottom = element.getBoundingClientRect().bottom + y;
      return { top, bottom, screen: bottom - top <= viewport + slack };
    });
    // 视口顶边落在哪个区块里
    let index = 0;
    boxes.forEach((box, i) => {
      if (box.top <= y + EDGE) index = i;
    });
    const current = boxes[index];
    if (!current) return null;
    let target: number | null = null;
    if (direction > 0) {
      const below = current.bottom - (y + viewport);
      // 这个区块下面还有没看到的部分：只差一点就先把它的底边对齐（不跳过内容），差得多就继续在里面滚
      if (below > EDGE) target = below <= slack ? current.bottom - viewport : null;
      else target = boxes[index + 1]?.top ?? null;
    } else {
      const above = y - current.top;
      if (above > EDGE) {
        // 停在区块中间：一屏高的（或只差一点的）回到它的顶部，更高的继续在里面滚
        target = current.screen || above <= slack ? current.top : null;
      } else {
        const previous = boxes[index - 1];
        // 上一个区块比视口高时回到它的末尾，而不是一下跳到它的开头
        if (previous) target = previous.screen ? previous.top : previous.bottom - viewport;
      }
    }
    if (target === null) return null;
    target = Math.max(0, Math.min(Math.round(target), limit));
    return Math.abs(target - y) < 2 ? null : target;
  }

  const ease = gsap.parseEase("power3.inOut");
  const lenis = new Lenis({
    // 平时的平滑滚动：有一点惯性但不拖沓
    lerp: 0.11,
    virtualScroll: ({ deltaY, event }) => {
      if (!(event instanceof WheelEvent) || event.ctrlKey) return true;
      const now = performance.now();
      const size = Math.abs(deltaY);
      if (now - lastAt > 160 || size > lastSize * 1.6 + 6) armed = true;
      lastAt = now;
      lastSize = size;
      // 返回 false 只是让 Lenis 不处理这次事件，浏览器自己的滚动要另外拦住
      const swallow = () => {
        if (event.cancelable) event.preventDefault();
        return false;
      };
      if (animating || !armed) return swallow();
      const direction = deltaY > 0 ? 1 : deltaY < 0 ? -1 : 0;
      if (!direction) return true;
      const target = snapTarget(direction);
      if (target === null) return true;
      animating = true;
      armed = false;
      lenis.scrollTo(target, {
        // 整屏的移动用足时长，只挪一小段时相应缩短
        duration: Math.min(1.15, 0.55 + (0.6 * Math.abs(target - window.scrollY)) / window.innerHeight),
        easing: ease,
        lock: true,
        force: true,
        onComplete: () => {
          animating = false;
        }
      });
      return swallow();
    }
  });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  // 随滚动推进的画面：都放在一个 context 里，离开页面时一并撤销
  const context = gsap.context(() => {
    const hero = root.querySelector<HTMLElement>("main > section.hero");
    const heroCopy = hero?.querySelector<HTMLElement>(".wrap");
    if (hero && heroCopy) {
      // 首屏离场：文字比背景走得快一点并淡出，像被下一屏「接」走
      gsap.to(heroCopy, { yPercent: -28, autoAlpha: 0, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      const backdrop = hero.querySelector<HTMLElement>(".hero-bg");
      if (backdrop) gsap.to(backdrop, { yPercent: 14, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    }
    // 没有自带进场效果的区块：标题随进入视口上浮出现
    root.querySelectorAll<HTMLElement>("main > section:not(.hero):not(#help):not(#locations) .section-head, main > section.cta-band .wrap").forEach(head => {
      gsap.from(head, { y: 48, autoAlpha: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: head, start: "top 82%", once: true } });
    });
  }, root);

  return () => {
    context.revert();
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}
