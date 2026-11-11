<template>
  <div ref="root" class="pg pg-home">
    <SiteHeader ref="header" :scrolled="navScrolled || !on('hero')" />

    <main id="top">
      <section v-if="on('hero')" id="heroSection" ref="hero" class="hero on-hero">
        <div class="hero-bg" aria-hidden="true">
          <div class="hero-frame">
            <video ref="heroVideo" autoplay muted loop playsinline preload="auto" :poster="img('hero.poster')">
              <source :src="raw<string>('hero.video')" type="video/mp4" />
            </video>
            <svg class="hero-type" viewBox="0 0 1280 720" preserveAspectRatio="none" focusable="false">
              <g>
                <text x="139.8" y="296">U</text>
                <text x="317.7" y="296">S</text>
                <text x="472.3" y="296">W</text>
                <text x="722.9" y="296">O</text>
                <text x="938.0" y="296">O</text>
              </g>
            </svg>
            <img class="hero-city" :src="img('hero.cityLayer')" alt="" decoding="async" />
          </div>
        </div>
        <div class="hero-scrim" aria-hidden="true" />
        <div class="wrap">
          <h1 v-html="ch('hero.title')" />
          <p class="sub">{{ c("hero.sub") }}</p>
        </div>
      </section>

      <section v-if="on('help')" id="help" class="band-paper">
        <div class="wrap">
          <div class="section-head centered">
            <p class="eyebrow"><span class="idx">{{ c("help.index") }}</span> {{ c("help.eyebrow") }}</p>
            <h2 v-html="ch('help.title')" />
            <p class="lede">
              {{ c("help.lede") }}
            </p>
          </div>

          <div class="flow">
            <div v-for="index in list('help.cards')" :key="index" class="media-card flow-step">
              <div class="media-card-media">
                <SlotImage :src="img(`help.cards.${index}.image`)" :radius="8" :alt="c(`help.cards.${index}.title`)" />
              </div>
              <div class="media-card-body">
                <h3>{{ c(`help.cards.${index}.title`) }}</h3>
                <p>{{ c(`help.cards.${index}.text`) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="on('locations')" id="locations" class="band-paper">
        <div class="wrap">
          <div class="section-head centered">
            <p class="eyebrow"><span class="idx">{{ c("locations.index") }}</span> {{ c("locations.eyebrow") }}</p>
            <h2>{{ c("locations.title") }}</h2>
            <p class="lede">
              {{ c("locations.lede") }}
            </p>
          </div>
        </div>
        <div class="wrap">
          <div class="locations-pin-wrap">
            <div ref="locationsRow" class="locations-row">
              <NuxtLink v-for="region in locationCards" :key="region.slug" class="location-card" :to="localePath(`/${region.slug}/city-guide`)">
                <div class="location-media"><SlotImage :src="region.image" :radius="14" :alt="region.name" /></div>
                <div class="location-dark-overlay" />
                <div class="location-label">
                  <span class="loc-icon" aria-hidden="true">{{ region.emoji }}</span><span>{{ region.name }}</span>
                </div>
                <div class="location-code">{{ region.shortCode }}</div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <section v-if="on('listings') && featured.length" id="listings" class="band-paper">
        <div class="wrap">
          <div class="section-head centered">
            <p class="eyebrow"><span class="idx">{{ c("listings.index") }}</span> {{ c("listings.eyebrow") }}</p>
            <h2 v-html="ch('listings.title')" />
            <p class="lede">{{ c("listings.lede") }}</p>
          </div>
          <div class="ls-grid">
            <ListingCard v-for="listing in featured" :key="listing.id" :listing="listing" :region="props.region" />
          </div>
          <div class="ls-more">
            <NuxtLink class="btn btn-outline on-paper" :to="localePath(regionPath('listings', props.region))">{{ c("listings.cta") }}</NuxtLink>
          </div>
        </div>
      </section>

      <section v-if="on('about')" id="about" class="band-raised">
        <div class="wrap">
          <div class="about-split">
            <div class="about-copy">
              <div class="section-head">
                <p class="eyebrow"><span class="idx">{{ c("about.index") }}</span> {{ c("about.eyebrow") }}</p>
                <h2 v-html="ch('about.title')" />
                <p class="lede">{{ c("about.lede") }}</p>
              </div>
              <NuxtLink class="btn btn-outline on-paper m-hide" :to="localePath(regionPath('about', props.region))">{{ c("about.cta") }}</NuxtLink>
            </div>
            <div ref="statGrid" class="stat-grid2">
              <div v-for="index in list('about.stats')" :key="index" class="stat-item">
                <div class="num" style="color: #000000">
                  <span class="accent" style="color: #000000">{{ shown[index] }}</span><span style="color: #000000">+</span>
                </div>
                <div class="pill">{{ c(`about.stats.${index}.label`) }}</div>
                <p class="desc">{{ c(`about.stats.${index}.desc`) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="on('cta')" id="cta" class="band-paper cta-band">
        <div class="wrap">
          <p class="eyebrow"><span class="idx">{{ c("cta.index") }}</span> {{ c("cta.eyebrow") }}</p>
          <h2 v-html="ch('cta.title')" />
          <p class="lede">{{ c("cta.lede") }}</p>
          <div class="btn-row">
            <NuxtLink class="btn btn-pink" :to="localePath(regionPath('contact', props.region))">{{ c("cta.primary") }}</NuxtLink>
            <NuxtLink class="btn btn-outline on-paper" :to="localePath(regionPath('contact', props.region))">{{ c("cta.secondary") }}</NuxtLink>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import "~/assets/css/pages/home.css";
import "~/assets/css/pages/home.extra.css";
import type { Listing, Paged, Region } from "~~/shared/types/api";

const { bi } = useTx();
const localePath = useLocalePath();
const api = useApi();
/**
 * 首页。不带地区是全站首页（/），带地区是该地区的首页（/{region}）。
 * 内容来自 CMS 的 home 页面：地区可以只改其中几个区块或隐藏某个区块，其余沿用全站默认。
 */
const props = defineProps<{ region?: string }>();
await useRegion(props.region);
const { c, ch, img, raw, list, on, page } = await usePageContent("home", props.region);
const { c: site } = await useSite();

// ---- 内容 ----

/** 统计数字的数值，顺序与 CMS 里 about.stats 列表一致 */
const statValues = computed(() => list("about.stats").map(index => Number(raw(`about.stats.${index}.value`)) || 0));

const regions = await useRegions();
// 地区首页只展示本地区的房源
const { data: featuredData } = await useAsyncData(`home:listings:${props.region ?? ""}`, async () => {
  const scope = props.region ? { region: props.region } : {};
  const featuredOnly = await api<Paged<Listing>>("/listings", { query: { ...scope, featured: 1, pageSize: 3 } }).catch(() => null);
  if (featuredOnly?.list.length) return featuredOnly.list;
  // 没有标记“首页精选”的房源时，用最新的三条
  return (await api<Paged<Listing>>("/listings", { query: { ...scope, pageSize: 3 } }).catch(() => null))?.list ?? [];
});
const featured = computed(() => featuredData.value ?? []);

/** 地区卡片：顺序和卡片图都以 CMS 的地区设置为准，没配卡片图的地区不出卡片 */
const locationCards = computed(() =>
  (regions.value ?? [])
    .map(region => ({ slug: region.slug, name: bi(region.name), emoji: region.emoji, shortCode: region.shortCode, image: region.cover?.url }))
    .filter(region => region.image)
);

const absoluteUrl = useAbsoluteUrl();
usePageSeo(() => ({
  title: c("seo.title"),
  description: c("seo.description"),
  keywords: c("seo.keywords"),
  // 地区没有单独配置内容时，地区首页与全站首页相同：canonical 指向全站首页
  canonicalPath: props.region && page.value.resolvedFrom === "global" ? "/" : undefined,
  jsonLd: [
    { "@type": "Organization", name: site("brand.wordmark"), url: absoluteUrl("/"), logo: absoluteUrl(img("seo.logo")) },
    { "@type": "WebSite", name: site("brand.wordmark"), url: absoluteUrl("/") }
  ]
}));

// ---- 交互（移植自原页面脚本，行为保持一致）----

const header = ref<{ el: HTMLElement | null } | null>(null);
const hero = ref<HTMLElement | null>(null);
const heroVideo = ref<HTMLVideoElement | null>(null);
const locationsRow = ref<HTMLElement | null>(null);
const statGrid = ref<HTMLElement | null>(null);
const navScrolled = ref(false);
/** 统计数字：服务端直接输出最终值；桌面端滚动到位后从 0 数上来 */
const shown = ref(statValues.value.map(value => value.toLocaleString("en-US")));

const cleanups: (() => void)[] = [];

onMounted(() => {
  const video = heroVideo.value;
  if (video) {
    video.muted = true;
    video.loop = true;
    const tryPlay = () => void video.play()?.catch(() => {});
    tryPlay();
    video.addEventListener("canplay", tryPlay);
    cleanups.push(() => video.removeEventListener("canplay", tryPlay));
  }

  // 首屏滚出视口后导航变成实底
  if (hero.value) {
    const io = new IntersectionObserver(entries => entries.forEach(entry => (navScrolled.value = !entry.isIntersecting)), { threshold: 0, rootMargin: "-72px 0px 0px 0px" });
    io.observe(hero.value);
    cleanups.push(() => io.disconnect());
  }

  const helpSection = document.getElementById("help");
  const locationsSection = document.getElementById("locations");
  // 手机：每张卡片滚入时各自出现，而不是整段一起
  const phoneReveal = window.matchMedia("(max-width:760px)").matches;
  const revealEach = (elements: Element[]) => {
    const io = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("m-in");
            io.unobserve(entry.target);
          }
        }),
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );
    elements.forEach(element => io.observe(element));
    cleanups.push(() => io.disconnect());
  };
  const revealOnce = (target: Element | null, section: Element | null) => {
    if (!target || !section) return;
    const io = new IntersectionObserver(
      (entries, observer) =>
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            section.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.2 }
    );
    io.observe(target);
    cleanups.push(() => io.disconnect());
  };

  if (phoneReveal) {
    document.documentElement.classList.add("m-reveal");
    cleanups.push(() => document.documentElement.classList.remove("m-reveal"));
    if (helpSection) revealEach(Array.from(helpSection.querySelectorAll(".flow-step")));
    if (locationsSection) revealEach(Array.from(locationsSection.querySelectorAll(".section-head, .location-card")));
  } else {
    revealOnce(helpSection, helpSection);
    // 观察固定高度的卡片行而不是整段：整段很高，按比例的阈值几乎不会触发
    revealOnce(locationsRow.value, locationsSection);
  }

  // 城市卡片在窄屏上先保持暗色，滚轮逐个点亮；宽屏直接全部显示
  let citiesRevealed = window.innerWidth > 860;
  let startStats: (() => void) | null = null;
  const row = locationsRow.value;
  if (row && window.innerWidth <= 860) {
    const cards = Array.from(row.querySelectorAll(".location-card"));
    const STEP = 240;
    const COOLDOWN = 450;
    let activeIndex = -1;
    let accumulated = 0;
    let steppedAt = 0;
    const paint = () => cards.forEach((card, index) => card.classList.toggle("active", index === activeIndex));
    const onWheel = (event: WheelEvent) => {
      const rect = row.getBoundingClientRect();
      const offset = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
      if (offset > Math.max(140, rect.height / 3)) return;
      const down = event.deltaY > 0;
      if (activeIndex === -1) {
        if (!down) return;
        event.preventDefault();
        activeIndex = 0;
        accumulated = 0;
        steppedAt = Date.now();
        paint();
        return;
      }
      if (down && activeIndex === cards.length - 1) return;
      if (!down && activeIndex === 0) {
        activeIndex = -1;
        accumulated = 0;
        steppedAt = Date.now();
        paint();
        return;
      }
      event.preventDefault();
      const now = Date.now();
      if (now - steppedAt < COOLDOWN) {
        accumulated = 0;
        return;
      }
      accumulated += event.deltaY;
      if (accumulated >= STEP && activeIndex < cards.length - 1) activeIndex += 1;
      else if (accumulated <= -STEP && activeIndex > 0) activeIndex -= 1;
      else return;
      accumulated = 0;
      steppedAt = now;
      paint();
      if (activeIndex === cards.length - 1) {
        citiesRevealed = true;
        startStats?.();
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    cleanups.push(() => window.removeEventListener("wheel", onWheel));
  }

  // 统计数字：手机直接显示最终值；其余设备等城市卡片都亮过、数字进入视口后从 0 数上来
  const grid = statGrid.value;
  if (grid && window.innerWidth > 560) {
    let started = false;
    const targets = statValues.value;
    const countUp = () => {
      const startedAt = performance.now();
      const duration = 1200;
      const step = (now: number) => {
        const t = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        shown.value = targets.map(target => Math.round(target * eased).toLocaleString("en-US"));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const citiesCleared = () => citiesRevealed || window.innerWidth <= 860 || !row || row.getBoundingClientRect().bottom < 0;
    startStats = () => {
      if (started) return;
      const rect = grid.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
      if (!inView || !citiesCleared()) return;
      started = true;
      window.removeEventListener("scroll", startStats!);
      countUp();
    };
    // 还没滚到的时候先归零，等进入视口再数；已经在视口里的直接开始
    const rect = grid.getBoundingClientRect();
    if (rect.top >= window.innerHeight * 0.85 || !citiesCleared()) shown.value = targets.map(() => "0");
    window.addEventListener("scroll", startStats, { passive: true });
    cleanups.push(() => startStats && window.removeEventListener("scroll", startStats));
    startStats();
  }
});

// 整屏吸附 + 平滑滚动：CMS 里按地区开关（home → settings.fullpageSnap）。编辑预览时不启用，免得妨碍点选
const root = ref<HTMLElement | null>(null);
const { active: editing } = useCmsEdit();
let unmounted = false;
onMounted(() => {
  if (raw<boolean>("settings.fullpageSnap") !== true || editing.value || !root.value) return;
  void startFullpageSnap(root.value).then(stop => {
    // 库是按需加载的：加载完成时页面可能已经离开了
    if (unmounted) stop();
    else cleanups.push(stop);
  });
});

onBeforeUnmount(() => {
  unmounted = true;
  cleanups.splice(0).forEach(cleanup => cleanup());
});
</script>
