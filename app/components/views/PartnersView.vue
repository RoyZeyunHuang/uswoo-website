<template>
  <div ref="root" class="pg pg-partners">
    <!-- 这一页没有深色首屏，导航一直是实底 -->
    <SiteHeader active="partners" scrolled />

    <main id="top">
      <!-- 这一段装着 editorial 和 offers 两块内容：两块都没有时整段不输出，免得留一条空白色带 -->
      <section v-if="on('editorial') || list('offers').length" id="what-we-do" class="band-raised">
        <div class="wrap">
          <div v-if="on('editorial')" class="editorial">
            <div class="editorial-media editorial-media-l">
              <SlotImage :src="img('editorial.imageLeft')" alt="" eager />
            </div>

            <div class="editorial-copy">
              <p class="editorial-hey">{{ c("editorial.hey") }}</p>
              <h2 v-html="ch('editorial.title')" />
              <p class="lede">{{ c("editorial.lede") }}</p>
            </div>

            <div class="editorial-right">
              <div class="editorial-media editorial-media-r">
                <SlotImage :src="img('editorial.imageRight')" alt="" eager />
              </div>
            </div>
          </div>

          <!-- 展开/收起直接改 DOM 上的 class（与原页面一致）：这些元素还会被滚动动效加 class，用响应式 class 会互相覆盖 -->
          <div class="offer-row">
            <div v-for="index in list('offers')" :key="index" class="offer-item" :class="index === 0 ? 'open' : undefined">
              <div class="offer-head" data-offer-toggle role="button" tabindex="0" :aria-expanded="index === 0 ? 'true' : 'false'">
                <span class="offer-num">{{ pad(index) }}</span>
                <h3>{{ c(`offers.${index}.title`) }}</h3>
                <span class="offer-toggle" aria-hidden="true" />
              </div>
              <p>{{ c(`offers.${index}.text`) }}</p>
            </div>
          </div>
        </div>
      </section>

      <section v-if="on('hero')" id="heroSection" class="partners-hero">
        <div class="partners-hero-photo">
          <div class="partners-hero-bg" aria-hidden="true">
            <SlotImage :src="img('hero.image')" alt="" />
          </div>
          <div class="partners-hero-scrim" aria-hidden="true" />

          <div class="partners-hero-top wrap">
            <div class="partners-hero-grid">
              <h1 v-html="ch('hero.title')" />
              <p class="hero-slogan">
                {{ c("hero.slogan") }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section v-if="on('why')" id="why-uswoo" class="band-paper">
        <div class="wrap">
          <div class="why-bento-wrap">
            <div class="why-copy">
              <div class="section-head">
                <p class="eyebrow"><span class="idx">03</span> {{ c("why.eyebrow") }}</p>
                <h2 v-html="ch('why.title')" />
                <p class="lede">
                  {{ c("why.lede") }}
                </p>
              </div>
            </div>

            <div class="why-bento">
              <div v-for="index in list('why.cards')" :key="index" class="why-card" :class="index === 0 ? 'featured' : undefined">
                <span class="press-icon"
                  ><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="whyIcons[index]"
                /></span>
                <h4>{{ c(`why.cards.${index}.title`) }}</h4>
                <p>{{ c(`why.cards.${index}.text`) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="on('performance')" id="performance" class="band-raised">
        <div class="wrap">
          <div class="section-head centered perf-head">
            <p class="eyebrow"><span class="idx">04</span> {{ c("performance.eyebrow") }}</p>
            <h2 v-html="ch('performance.title')" />
          </div>

          <!-- 四张卡片各占一种版式（按顺序 a/b/c/d）；内容逐项取自 CMS 的 performance.cards -->
          <div class="bento perf-bento">
            <div v-for="index in list('performance.cards')" :key="index" :class="['bento-card', `bento-${perfLayout(index)}`]">
              <template v-if="perfLayout(index) === 'a'">
                <div class="photo"><img :src="img(`performance.cards.${index}.image`)" alt="" loading="lazy" /></div>
                <div>
                  <div class="num" :data-num="index">{{ shown[index] }}</div>
                  <span class="pill">{{ c(`performance.cards.${index}.label`) }}</span>
                  <p class="desc">{{ c(`performance.cards.${index}.desc`) }}</p>
                </div>
              </template>
              <template v-else-if="perfLayout(index) === 'b'">
                <img :src="img(`performance.cards.${index}.image`)" alt="" loading="lazy" />
                <div class="inner">
                  <div class="num" :data-num="index">{{ shown[index] }}</div>
                  <span class="pill">{{ c(`performance.cards.${index}.label`) }}</span>
                  <p class="desc">{{ c(`performance.cards.${index}.desc`) }}</p>
                </div>
              </template>
              <template v-else-if="perfLayout(index) === 'c'">
                <div class="num" :data-num="index">{{ shown[index] }}</div>
                <div>
                  <span class="pill">{{ c(`performance.cards.${index}.label`) }}</span>
                  <p class="desc">{{ c(`performance.cards.${index}.desc`) }}</p>
                </div>
              </template>
              <template v-else>
                <div class="copy">
                  <span class="pill">{{ c(`performance.cards.${index}.label`) }}</span>
                  <p class="desc">{{ c(`performance.cards.${index}.desc`) }}</p>
                </div>
                <div class="photo"><img :src="img(`performance.cards.${index}.image`)" alt="" loading="lazy" /></div>
              </template>
            </div>
          </div>
        </div>
      </section>

      <section v-if="on('cta')" id="cta" class="band-paper cta-band">
        <div class="wrap">
          <p class="eyebrow"><span class="idx">05</span> {{ c("cta.eyebrow") }}</p>
          <h2 v-html="ch('cta.title')" />
          <p class="lede">
            {{ c("cta.lede") }}
          </p>
          <div class="btn-row">
            <NuxtLink class="btn btn-pink" :to="link('cta.href')">{{ c("cta.button") }}</NuxtLink>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import "~/assets/css/pages/partners.css";

const props = defineProps<{ region?: string }>();

// 先校验地区：网址里的地区不存在时直接 404
const { region } = await useRegion(props.region);
const { tx, bi } = useTx();
const localePath = useLocalePath();
const { c, ch, img, raw, list, on, page } = await usePageContent("partners", props.region);
const { c: site } = await useSite();

// ---- 内容 ----

const pad = (index: number) => String(index + 1).padStart(2, "0");

/** CMS 里配置的链接：站内路径按当前语言加前缀，外部地址原样使用 */
const link = (path: string) => {
  const href = raw<string>(path);
  return href?.startsWith("/") ? localePath(href) : href;
};

/** 「为什么选择 USWOO」四张卡片的图标（按顺序对应 CMS 里的 why.cards；属于版式，不是内容） */
const whyIcons = [
  '<path d="M12 21s-7-5.1-7-11a7 7 0 0 1 14 0c0 5.9-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a13.5 13.5 0 0 1 0 18a13.5 13.5 0 0 1 0-18Z"/>',
  '<path d="M15.5 20v-1.5a4 4 0 0 0-4-4h-5a4 4 0 0 0-4 4V20"/><circle cx="9" cy="7.5" r="3.5"/><path d="M21.5 20v-1.5a4 4 0 0 0-3-3.87"/><path d="M16 4.13a4 4 0 0 1 0 7.75"/>',
  '<path d="M19.1 5.8a4.6 4.6 0 0 0-6.5 0l-.6.6-.6-.6a4.6 4.6 0 1 0-6.5 6.5l7.1 7.1 7.1-7.1a4.6 4.6 0 0 0 0-6.5Z"/>'
];

/** 成效卡片的版式：前四张依次是 a/b/c/d，多出来的沿用 c（只有数字和文字） */
const perfLayout = (index: number) => ["a", "b", "c", "d"][index] ?? "c";

/** 成效数字（带单位的文字，例如 "65–75%"）；服务端直接输出最终值，卡片滚入时再从 0 数上来 */
const nums = computed(() => list("performance.cards").map(index => String(raw<string | number>(`performance.cards.${index}.num`) ?? "")));
const counting = ref<Record<number, string>>({});
const shown = computed(() => nums.value.map((value, index) => counting.value[index] ?? value));

// ---- SEO ----

const absoluteUrl = useAbsoluteUrl();
usePageSeo(() => {
  const here = absoluteUrl(localePath(regionPath("partners", props.region)));
  const crumbs = [
    { name: tx("Home"), url: absoluteUrl(localePath("/")) },
    { name: c("seo.breadcrumb"), url: absoluteUrl(localePath(regionPath("partners"))) },
    ...(region.value ? [{ name: bi(region.value.name), url: here }] : [])
  ];
  return {
    title: region.value ? c("seo.regionTitle").replace("{region}", bi(region.value.name)) : c("seo.title"),
    description: c("seo.description"),
    keywords: c("seo.keywords"),
    image: img("hero.image"),
    // 地区没有单独配置内容时显示的是全站默认内容：canonical 指回汇总页，避免重复收录
    canonicalPath: region.value && page.value?.resolvedFrom !== "region" ? regionPath("partners") : undefined,
    jsonLd: [
      ...(region.value ? [{ "@type": "RealEstateAgent", name: site("brand.wordmark"), areaServed: region.value.name.en, url: here }] : []),
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: crumb.url }))
      }
    ]
  };
});

// ---- 交互（移植自原页面脚本，行为保持一致）----

const root = ref<HTMLElement | null>(null);
const cleanups: (() => void)[] = [];

onMounted(() => {
  const scope = root.value;
  if (!scope) return;

  // 三项服务的折叠（只有手机版式会收起；更宽的屏幕上样式让三项都展开）
  const toggleOffer = (event: MouseEvent | KeyboardEvent) => {
    const head = (event.target as Element | null)?.closest?.("[data-offer-toggle]");
    const item = head?.parentElement;
    if (!head || !item) return;
    if (event instanceof KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
    }
    const open = !item.classList.contains("open");
    item.classList.toggle("open", open);
    head.setAttribute("aria-expanded", open ? "true" : "false");
  };
  scope.addEventListener("click", toggleOffer);
  scope.addEventListener("keydown", toggleOffer);
  cleanups.push(() => {
    scope.removeEventListener("click", toggleOffer);
    scope.removeEventListener("keydown", toggleOffer);
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 桌面端的“覆盖”效果：这两段正常滚到底边贴住屏幕底部后停住，下一段从上面滑过去
  const pinned = ["#heroSection", "#why-uswoo"].map(selector => scope.querySelector<HTMLElement>(selector)).filter((element): element is HTMLElement => !!element);
  if (pinned.length && !reduceMotion) {
    const pin = () => pinned.forEach(element => (element.style.top = window.innerWidth > 860 ? `${Math.min(0, window.innerHeight - element.offsetHeight)}px` : ""));
    pin();
    window.addEventListener("resize", pin);
    cleanups.push(() => window.removeEventListener("resize", pin));
  }

  if (reduceMotion) return;

  // 滚动出现：元素进入视口时淡入/滑入一次
  const wide = window.innerWidth > 860;
  // 手机上 03、04 两段没有入场动效，数字也不滚动
  const phone = window.innerWidth <= 560;
  const groups: [string, string, number][] = [
    [".partners-hero-grid h1", wide ? "rv-hero-in" : "rv-focus", 0.15],
    [".hero-slogan", wide ? "rv-hero-in" : "rv-rise", wide ? 0.8 : 0.35],
    [".editorial-media-l", "rv-wipe-l", 0],
    [".editorial-media-r", "rv-wipe-r", 0.15],
    [".editorial-hey", "rv-rise", 0.3],
    [".editorial-copy h2", "rv-rise", 0.45],
    [".editorial-copy .lede", "rv-rise", 0.6],
    [".offer-item", "rv-left", 0],
    [".why-copy .section-head", "rv-left", 0],
    [".why-copy .btn", "rv-rise", 0.3],
    [".why-card", "tilt", 0],
    [".perf-head", "rv-focus", 0],
    [".perf-bento .bento-card", "rv-lift", 0],
    [".cta-band .eyebrow", "rv-rise", 0],
    [".cta-band h2", "rv-track", 0.15],
    [".cta-band .lede", "rv-rise", 0.4],
    [".cta-band .btn-row", "rv-pop", 0.6]
  ];
  const targets: HTMLElement[] = [];
  groups.forEach(([selector, kind, base]) => {
    if (phone && (selector.startsWith(".perf") || selector.startsWith(".why-"))) return;
    scope.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
      element.classList.add("rv", kind === "tilt" ? (index % 2 ? "rv-tilt-r" : "rv-tilt-l") : kind);
      element.style.setProperty("--d", `${base + index * 0.12}s`);
      targets.push(element);
    });
  });

  // 04：卡片出现时数字从 0 数上来（文字里的每一段数字各自滚动，单位和符号不动）
  let unmounted = false;
  cleanups.push(() => (unmounted = true));
  const countUp = (index: number) => {
    const template = nums.value[index];
    const parts = template?.match(/[\d,]+/g);
    if (!template || !parts) return;
    const startedAt = performance.now();
    const duration = 1400;
    const step = (now: number) => {
      if (unmounted) return;
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      let n = 0;
      const text = template.replace(/[\d,]+/g, () => Math.round(parseInt(parts[n++]!.replace(/,/g, ""), 10) * eased).toLocaleString("en-US"));
      // 数完后交还给内容本身（之后 CMS 内容或语言变化时照常更新）
      if (t < 1) counting.value = { ...counting.value, [index]: text };
      else counting.value = Object.fromEntries(Object.entries(counting.value).filter(([key]) => Number(key) !== index));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const timers: number[] = [];
  cleanups.push(() => timers.forEach(timer => window.clearTimeout(timer)));
  const reveal = new IntersectionObserver(
    entries =>
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        reveal.unobserve(entry.target);
        const num = entry.target.querySelector<HTMLElement>(".num[data-num]");
        if (!phone && num && entry.target.closest(".perf-bento")) timers.push(window.setTimeout(() => countUp(Number(num.dataset.num)), 250));
      }),
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  targets.forEach(element => reveal.observe(element));
  cleanups.push(() => reveal.disconnect());
});

onBeforeUnmount(() => cleanups.splice(0).forEach(cleanup => cleanup()));
</script>
