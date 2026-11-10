<template>
  <div class="pg pg-services">
    <SiteHeader active="services" :scrolled="true" />

    <!-- js-motion 原先加在 <html> 上；页面样式整体收进了 .pg-services 之内，所以改加在 main 上 -->
    <main id="top" :class="{ 'js-motion': motion }">
      <section id="heroSection" ref="hero" class="split-hero band-paper">
        <div class="split-hero-grid">
          <div class="split-hero-text">
            <p class="eyebrow"><span class="idx">{{ c("hero.index") }}</span>{{ c("hero.eyebrow") }}</p>
            <h1 v-html="ch('hero.title')" />
            <p class="sub">{{ c("hero.sub") }}</p>
            <div class="btn-row">
              <NuxtLink class="btn btn-primary" :to="localePath('/contact')">{{ c("hero.cta") }}</NuxtLink>
            </div>
          </div>
          <div class="split-hero-media">
            <SlotImage :src="img('hero.image')" :alt="c('hero.imageAlt')" eager />
          </div>
        </div>
      </section>

      <section id="our-process" ref="processSection" class="band-paper" style="padding-top: clamp(101px, 16.2vw, 180px)">
        <div class="wrap">
          <div class="section-head centered" data-rv>
            <p class="eyebrow"><span class="idx">{{ c("process.index") }}</span>{{ c("process.eyebrow") }}</p>
            <h2 v-html="ch('process.title')" />
          </div>

          <div class="process-cards" data-io>
            <div v-for="index in list('process.cards')" :key="index" class="process-card" :style="{ '--i': index }">
              <!-- eslint-disable-next-line vue/no-v-html -- 图标是写在代码里的固定 SVG -->
              <div class="process-card-icon" aria-hidden="true" v-html="processIcons[index] ?? ''" />
              <div class="process-card-media">
                <SlotImage :src="img(`process.cards.${index}.image`)" :alt="c(`process.cards.${index}.title`)" />
              </div>
              <div class="process-card-text">
                <h3>{{ c(`process.cards.${index}.title`) }}</h3>
                <p class="process-card-desc">{{ c(`process.cards.${index}.desc`) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="move-in-essentials" class="band-raised">
        <div class="wrap">
          <div class="section-head centered beyond-head" data-rv>
            <p class="eyebrow"><span class="idx">{{ c("beyond.index") }}</span> {{ c("beyond.eyebrow") }}</p>
            <h2>{{ c("beyond.title") }}</h2>
            <p class="lede m-full" style="margin-top: 16px">
              {{ c("beyond.lede") }}
            </p>
            <p class="lede m-short" style="margin-top: 16px">
              {{ c("beyond.ledeShort") }}
            </p>
          </div>

          <div class="essentials-grid-dark" data-io>
            <div v-for="index in list('beyond.cards')" :key="index" class="essential-card-dark" :style="{ '--i': essentialDelays[index] ?? 0 }">
              <div class="essential-icon-upload"><SlotImage :src="img(`beyond.cards.${index}.icon`)" alt="" /></div>
              <h3>{{ c(`beyond.cards.${index}.title`) }}</h3>
              <p>
                {{ essentialText(index).body }}<span v-if="essentialText(index).stop" class="zh-stop">{{ essentialText(index).stop }}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="cta" class="band-paper">
        <div class="wrap">
          <div class="testimonial-block" data-io>
            <div class="testimonial-card">
              <div class="quote-mark">&ldquo;</div>
              <p class="quote-text">
                {{ c("quote.text") }}
              </p>
              <div class="wechat-cta">
                <div class="wechat-qr">
                  <img
                    :src="img('quote.qr')"
                    :alt="c('quote.qrAlt')"
                    style="width: 100%; height: 100%; display: block; object-fit: contain"
                  />
                </div>
                <div>
                  <strong>{{ c("quote.wechat") }}</strong>
                </div>
              </div>
            </div>
            <div class="testimonial-media">
              <SlotImage :src="img('quote.image')" alt="" />
            </div>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import "~/assets/css/pages/services.css";
import "~/assets/css/pages/services.extra.css";

const { tx, isZh } = useTx();
const localePath = useLocalePath();
const { c, ch, img, list } = await usePageContent("services");

// ---- 内容 ----

const svg = (paths: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

/** 流程卡片的图标：固定的 SVG，按卡片位置对应（卡片的标题、说明、图片在 CMS 里） */
const processIcons = [
  svg('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><circle cx="12" cy="13.5" r="2"/><path d="m13.5 15 2 2"/>'),
  svg('<rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="m8.5 13 2.5 2.5 4.5-5"/>'),
  svg('<path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="m3.5 8 8.5 4.5L20.5 8"/><path d="M12 12.5v8"/>'),
  svg('<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5"/><path d="M4 20v-4.5h4.5"/>')
];

/** 出场动画的错开序号，沿用设计稿里每张卡片的 --i，按卡片位置对应 */
const essentialDelays = [0, 1, 2, 3, 1, 2, 3, 4];

/** 中文说明在手机上不带句末的句号（原站 mobile-services.js 的做法）：把句号单独拆出来，由样式在窄屏隐藏 */
function essentialText(index: number): { body: string; stop: string } {
  const text = c(`beyond.cards.${index}.text`);
  return isZh.value && text.endsWith("。") ? { body: text.slice(0, -1), stop: "。" } : { body: text, stop: "" };
}

const absoluteUrl = useAbsoluteUrl();
usePageSeo(() => ({
  title: c("seo.title"),
  description: c("seo.description"),
  image: img("hero.image"),
  jsonLd: [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: tx("Home"), item: absoluteUrl(localePath("/")) },
        { "@type": "ListItem", position: 2, name: c("seo.breadcrumb"), item: absoluteUrl(localePath("/services")) }
      ]
    }
  ]
}));

// ---- 交互（移植自原页面脚本，行为保持一致）----

const hero = ref<HTMLElement | null>(null);
const processSection = ref<HTMLElement | null>(null);
/** 出场动画开关：服务端和不支持动画的环境下内容直接可见 */
const motion = ref(false);

const cleanups: (() => void)[] = [];

onMounted(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 桌面端的“覆盖”效果：这一段正常滚动到底边贴住屏幕底部后停住，下一段从上面盖过来
  const pinned = [hero.value, processSection.value].filter((element): element is HTMLElement => !!element);
  if (pinned.length && !reduce) {
    const pin = () =>
      pinned.forEach(element => {
        element.style.top = window.innerWidth > 860 ? `${Math.min(0, window.innerHeight - element.offsetHeight)}px` : "";
      });
    pin();
    window.addEventListener("resize", pin);
    cleanups.push(() => window.removeEventListener("resize", pin));
  }

  // 桌面端的停顿：向下滚到「Our Process」的停住位置时先停在那里，下一次滚轮手势才放行下一段；往回滚会重新布防
  const proc = processSection.value;
  if (proc && !reduce) {
    let gestures = 0;
    let lastWheel = 0;
    let released = false;
    const onWheel = (event: WheelEvent) => {
      if (window.innerWidth <= 860 || event.ctrlKey) return;
      const remaining = proc.getBoundingClientRect().bottom - window.innerHeight;
      if (remaining > 40) {
        released = false;
        gestures = 0;
      }
      if (event.deltaY <= 0 || released) return;
      const now = Date.now();
      if (remaining > 2) {
        if (event.deltaY < remaining) return;
        // 这一下会滚过头：改成刚好滚到停住的位置
        event.preventDefault();
        window.scrollBy(0, remaining);
        gestures = 0;
        lastWheel = now;
        return;
      }
      if (remaining < -2) return;
      // 间隔超过 180ms 才算新的一次手势（同一次手势的惯性滚动不算）
      if (now - lastWheel > 180) gestures += 1;
      lastWheel = now;
      if (gestures > 0) {
        released = true;
        return;
      }
      event.preventDefault();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    cleanups.push(() => window.removeEventListener("wheel", onWheel));
  }

  if (reduce || !("IntersectionObserver" in window)) return;
  motion.value = true;
  const io = new IntersectionObserver(
    entries =>
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      }),
    { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
  );
  document.querySelectorAll(".pg-services [data-rv], .pg-services [data-io]").forEach(element => io.observe(element));
  cleanups.push(() => io.disconnect());

  // 首屏一打开就在视口里，图片初始是完全裁掉的：直接展开，不等观察器
  const heroElement = hero.value;
  if (heroElement) requestAnimationFrame(() => requestAnimationFrame(() => heroElement.classList.add("in")));
});

onBeforeUnmount(() => cleanups.splice(0).forEach(cleanup => cleanup()));
</script>
