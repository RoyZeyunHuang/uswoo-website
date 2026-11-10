<template>
  <div class="pg pg-home">
    <SiteHeader ref="header" :scrolled="navScrolled" />

    <main id="top">
      <section id="heroSection" ref="hero" class="hero on-hero">
        <div class="hero-bg" aria-hidden="true">
          <div class="hero-frame">
            <video ref="heroVideo" autoplay muted loop playsinline preload="auto" :poster="img('hero.poster', '/assets/uswoo-hero-poster.jpg')">
              <source src="/assets/uswoo-hero-video.mp4" type="video/mp4" />
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
            <img class="hero-city" src="/assets/uswoo-hero-city.webp" alt="" decoding="async" />
          </div>
        </div>
        <div class="hero-scrim" aria-hidden="true" />
        <div class="wrap">
          <h1 v-html="ch('hero.title', 'Find Your Place in the City.', '在美国的新篇章<br class=m-br>从安心安家开始')" />
          <p class="sub">{{ c("hero.sub", "More than finding an apartment. We help you figure out where to live, how to settle in, and what comes next.") }}</p>
        </div>
      </section>

      <section id="help" class="band-paper">
        <div class="wrap">
          <div class="section-head centered">
            <p class="eyebrow"><span class="idx">02</span> {{ tx("How We Help") }}</p>
            <h2
              v-html="
                ch(
                  'help.title',
                  'A Better Way to Find Home.',
                  '<span class=zh-d>找家这件事原来可以更从容</span><span class=zh-m>落地新城市，原来可以更从容</span>'
                )
              "
            />
            <p class="lede">
              {{ c("help.lede", "Finding a place isn't just about square footage or rent. It's about the neighborhood, the commute, and the life you want to build around it.") }}
            </p>
          </div>

          <div class="flow">
            <div v-for="(card, index) in helpCards" :key="index" class="media-card flow-step">
              <div class="media-card-media">
                <SlotImage :src="img(`help.cards.${index}.image`, card.image)" :radius="8" :alt="c(`help.cards.${index}.title`, card.title)" />
              </div>
              <div class="media-card-body">
                <h3>{{ c(`help.cards.${index}.title`, card.title) }}</h3>
                <p>{{ c(`help.cards.${index}.text`, card.text) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="locations" class="band-paper">
        <div class="wrap">
          <div class="section-head centered">
            <p class="eyebrow"><span class="idx">03</span> {{ tx("Our Locations") }}</p>
            <h2>{{ c("locations.title", "Where We Operate.") }}</h2>
            <p class="lede">
              {{ c("locations.lede", "USWOO helps renters find home across six major U.S. markets.", "USWOO 已在美国六大核心市场，帮助租客找到属于自己的家。") }}
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

      <section v-if="featured.length" id="listings" class="band-paper">
        <div class="wrap">
          <div class="section-head centered">
            <p class="eyebrow"><span class="idx">04</span> {{ tx("Exclusive Listings") }}</p>
            <h2 v-html="ch('listings.title', 'Only Found at USWOO.', '独家房源，只在 USWOO')" />
            <p class="lede">{{ c("listings.lede", "Hand-picked homes you won't find anywhere else, ready to tour in our markets.") }}</p>
          </div>
          <div class="ls-grid">
            <ListingCard v-for="listing in featured" :key="listing.id" :listing="listing" />
          </div>
          <div class="ls-more">
            <NuxtLink class="btn btn-outline on-paper" :to="localePath('/listings')">{{ tx("View All Listings") }}</NuxtLink>
          </div>
        </div>
      </section>

      <section id="about" class="band-raised">
        <div class="wrap">
          <div class="about-split">
            <div class="about-copy">
              <div class="section-head">
                <p class="eyebrow"><span class="idx">05</span> {{ tx("About USWOO") }}</p>
                <h2 v-html="ch('about.title', 'Built on Local Experience.', '深耕本地，积累经验')" />
                <p class="lede">{{ c("about.lede", "Real market knowledge, local relationships, and thousands of renter journeys behind us.") }}</p>
              </div>
              <NuxtLink class="btn btn-outline on-paper m-hide" :to="localePath('/about')">{{ tx("Know More About Us") }}</NuxtLink>
            </div>
            <div ref="statGrid" class="stat-grid2">
              <div v-for="(stat, index) in stats" :key="index" class="stat-item">
                <div class="num" style="color: #000000">
                  <span class="accent" style="color: #000000">{{ shown[index] }}</span><span style="color: #000000">+</span>
                </div>
                <div class="pill">{{ c(`about.stats.${index}.label`, stat.label) }}</div>
                <p class="desc">{{ c(`about.stats.${index}.desc`, stat.desc) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="cta" class="band-paper cta-band">
        <div class="wrap">
          <p class="eyebrow"><span class="idx">06</span> CTA</p>
          <h2 v-html="ch('cta.title', 'Your City Starts Here.', '你的城市生活<br class=m-br>从这里开始')" />
          <p class="lede">{{ c("cta.lede", "Looking for a home, exploring a neighborhood, or figuring out where to start? We're here to help.") }}</p>
          <div class="btn-row">
            <NuxtLink class="btn btn-pink" :to="localePath('/contact')">{{ tx("Find a Home") }}</NuxtLink>
            <NuxtLink class="btn btn-outline on-paper" :to="localePath('/contact')">{{ tx("Talk to USWOO") }}</NuxtLink>
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

const { tx, bi } = useTx();
const localePath = useLocalePath();
const api = useApi();
const { c, ch, img, raw } = await usePageContent("home");

// ---- 内容 ----

const helpCards = [
  { title: "Know Where to Live", text: "Neighborhoods, commute, schools and lifestyle.", image: "/assets/help-know-where.webp" },
  { title: "Find & Move", text: "The right home, with support from touring to move-in.", image: "/assets/help-find-move.webp" },
  { title: "Settle In & Connect", text: "Local resources, community and connections after you move.", image: "/assets/slots/help-img-3.jpg" }
];

const statDefaults = [
  { value: 200000, label: "Clients Served", desc: "Renters we've helped find the right place." },
  { value: 20000, label: "Leases Per Year", desc: "Leases signed across our markets annually." },
  { value: 10, label: "Cities & Markets", desc: "Metro areas covered by our local teams." },
  { value: 300, label: "Partners", desc: "Developers, brokerages, and vendors we work with." }
];
const stats = computed(() => statDefaults.map((stat, index) => ({ ...stat, value: Number(raw(`about.stats.${index}.value`, stat.value)) || stat.value })));

/** 地区卡片的默认图。地区在 CMS 里配了卡片图就用 CMS 的；两边都没有图的地区不在首页出卡片。图片来源见 docs/image-credits.md。 */
const regionImages: Record<string, string> = {
  "new-york": "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?auto=format&fit=crop&w=900&q=80",
  chicago: "/assets/loc-chicago.jpg",
  "los-angeles": "/assets/loc-la.jpg",
  "washington-dc": "/assets/loc-dc.jpg",
  philadelphia: "https://images.unsplash.com/photo-1543372993-5fc1fc83caac?auto=format&fit=crop&w=900&q=80",
  boston: "/assets/loc-boston.jpg"
};
/** 首页卡片沿用设计稿的顺序 */
const regionOrder = ["new-york", "chicago", "los-angeles", "washington-dc", "philadelphia", "boston"];

const regions = await useRegions();
const { data: featuredData } = await useAsyncData("home:listings", async () => {
  const featuredOnly = await api<Paged<Listing>>("/listings", { query: { featured: 1, pageSize: 3 } }).catch(() => null);
  if (featuredOnly?.list.length) return featuredOnly.list;
  // 没有标记“首页精选”的房源时，用最新的三条
  return (await api<Paged<Listing>>("/listings", { query: { pageSize: 3 } }).catch(() => null))?.list ?? [];
});
const featured = computed(() => featuredData.value ?? []);

const locationCards = computed(() =>
  [...(regions.value ?? [])]
    .sort((a, b) => regionOrder.indexOf(a.slug) - regionOrder.indexOf(b.slug))
    .map(region => ({ slug: region.slug, name: bi(region.name), emoji: region.emoji, shortCode: region.shortCode, image: region.cover?.url || regionImages[region.slug] }))
    .filter(region => region.image)
);

const absoluteUrl = useAbsoluteUrl();
usePageSeo(() => ({
  title: tx("USWOO | Find Your Place in the City"),
  description: c("hero.sub", "More than finding an apartment. We help you figure out where to live, how to settle in, and what comes next."),
  jsonLd: [
    { "@type": "Organization", name: "USWOO", url: absoluteUrl("/"), logo: absoluteUrl("/assets/uswoo-hero-poster.jpg") },
    { "@type": "WebSite", name: "USWOO", url: absoluteUrl("/") }
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
const shown = ref(stats.value.map(stat => stat.value.toLocaleString("en-US")));

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
    const targets = stats.value.map(stat => stat.value);
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

onBeforeUnmount(() => cleanups.splice(0).forEach(cleanup => cleanup()));
</script>
