<template>
  <div ref="root" class="pg pg-about">
    <SiteHeader active="about" :scrolled="navScrolled" />

    <main id="top">
      <section id="heroSection" ref="hero" class="about-hero">
        <div class="about-hero-bg" aria-hidden="true">
          <div ref="heroSlides" class="hero-slides">
            <div class="hero-slide"><img :src="img('hero.images.0', '/assets/about-hero-bedroom.webp')" alt="" decoding="async" /></div>
            <div class="hero-slide"><img :src="img('hero.images.1', '/assets/about-hero-kitchen-dance.jpg')" alt="" decoding="async" /></div>
          </div>
        </div>
        <div class="about-hero-scrim" aria-hidden="true" />
        <div class="slogan-inner hero-card">
          <span class="slogan-rule" aria-hidden="true" />
          <h1 :aria-label="heroTitle.label">
            <template v-for="(line, lineIndex) in heroTitle.lines" :key="lineIndex">
              <br v-if="lineIndex > 0" class="m-br" />
              <template v-for="word in line" :key="word.i">
                <span class="w" :style="{ '--i': word.i }"><span>{{ word.text }}</span></span
                >{{ word.gap }}
              </template>
            </template>
          </h1>
          <p>
            {{ c("hero.sub", "USWOO helps international students and young professionals feel at home in a new city, with thoughtful support that goes beyond finding a place to live.") }}
          </p>
        </div>
        <div class="wrap">
          <p class="eyebrow">{{ tx("About USWOO") }}</p>
          <a class="scroll-cue" href="#mission"><span class="line" aria-hidden="true" />{{ tx("Scroll") }}</a>
        </div>
      </section>

      <section id="mission" class="band-raised">
        <div class="wrap">
          <div class="mission-head">
            <p class="eyebrow"><span class="idx">01</span> {{ tx("Our Mission") }}</p>
            <h2 v-html="ch('mission.title', 'What we care about most.')" />
            <p class="lede">
              {{ c("mission.lede", "Whether it's your first apartment tour or your third year in the city, this is what USWOO shows up for.") }}
            </p>
          </div>

          <div class="mission-grid">
            <article v-for="(item, index) in missionItems" :key="index" class="mission-item" :style="{ '--i': index }">
              <div class="mission-media">
                <SlotImage :src="img(`mission.items.${index}.image`, item.image)" :radius="14" :alt="c(`mission.items.${index}.title`, item.title)" />
              </div>
              <span class="m-num">{{ pad(index) }}</span>
              <h3>{{ c(`mission.items.${index}.title`, item.title) }}</h3>
              <p class="m-full">{{ c(`mission.items.${index}.text`, item.text) }}</p>
              <p class="m-short">{{ c(`mission.items.${index}.textShort`, item.textShort) }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="our-story" class="band-raised">
        <div class="wrap">
          <div class="section-head">
            <p class="eyebrow"><span class="idx">02</span> {{ tx("Our Story") }}</p>
            <h2 v-html="ch('story.title', 'We started with renters. Then built around everything they needed.')" />
            <p class="m-full lede">
              {{
                c(
                  "story.lede",
                  "What began as leasing support has grown into a broader rental experience — connecting renters with homes, services and local partners before, during and after move-in."
                )
              }}
            </p>
            <p class="m-short lede">
              {{ c("story.ledeShort", "What began as leasing support now connects renters with homes, services and local partners, before and after move-in.") }}
            </p>
          </div>

          <div class="story-wrap">
            <div class="story-media-wide">
              <SlotImage :src="img('story.image', 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=1600&q=80')" :alt="tx('Our Story')" />
            </div>
          </div>

          <div class="story-essentials">
            <div v-for="(item, index) in storyItems" :key="index" class="story-essential-item icon-grid" :style="{ '--i': index }">
              <span class="press-icon"
                ><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="item.icon"
              /></span>
              <h4 v-html="ch(`story.items.${index}.title`, item.title, item.titleZh)" />
              <p>{{ c(`story.items.${index}.text`, item.text) }}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-we-got-here" class="band-paper">
        <div class="wrap">
          <div class="section-head">
            <p class="eyebrow"><span class="idx">03</span> {{ tx("How We Got Here") }}</p>
            <h2 v-html="ch('timeline.title', 'How we got here.')" />
          </div>

          <div class="timeline-track">
            <div v-for="(item, index) in timelineItems" :key="index" class="timeline-item" :style="{ '--i': index }">
              <span class="timeline-num">{{ pad(index) }}</span>
              <span class="timeline-dot" :style="{ '--i': index }" />
              <div class="timeline-media">
                <SlotImage :src="img(`timeline.items.${index}.image`, item.image)" :alt="c(`timeline.items.${index}.title`, item.title)" />
              </div>
              <h4>{{ c(`timeline.items.${index}.title`, item.title) }}</h4>
              <p>{{ c(`timeline.items.${index}.text`, item.text) }}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="grow-with-uswoo" class="cta-band band-paper">
        <div class="wrap">
          <p class="eyebrow"><span class="idx">04</span> {{ tx("Careers") }}</p>
          <h2 style="--i: 1" v-html="ch('careers.title', 'Grow with USWOO.')" />
          <p style="--i: 2" class="sub">
            {{ c("careers.sub", "We're building a team for people who understand cities, renters and what great service actually feels like.") }}
          </p>

          <div class="btn-row" style="--i: 6">
            <NuxtLink class="btn btn-primary" :to="localePath('/contact')"
              ><span class="m-full">{{ tx("View Open Roles →") }}</span
              ><span class="m-short">{{ tx("View Open Roles") }}</span></NuxtLink
            >
            <NuxtLink class="btn btn-outline" :to="localePath('/contact')"
              ><span class="m-full">{{ tx("Join Our Team →") }}</span
              ><span class="m-short">{{ tx("Join Our Team") }}</span></NuxtLink
            >
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import "~/assets/css/pages/about.css";

const props = defineProps<{ region?: string }>();

// 先校验地区：网址里的地区不存在时直接 404
const { region } = await useRegion(props.region);
const { tx, bi, isZh } = useTx();
const localePath = useLocalePath();
const { c, img, ch, page } = await usePageContent("about", props.region);

// ---- 内容 ----

const pad = (index: number) => String(index + 1).padStart(2, "0");

/**
 * 首屏标题逐词滑入：每个词要包一层 .w，通用的 ch() 白名单不允许这种标记，所以在这里自己拆。
 * 约定：空格分词，<br class=m-br> 是手机上的换行位置。
 */
const heroTitle = computed(() => {
  const text = c("hero.title", "Find Your Place. Feel at Home.", "找到属于你 的地方<br class=m-br>住出家 的感觉");
  const cjk = /[　-〿一-鿿＀-￯]/;
  // 中文一段一段出现，间隔放大一倍（与原页面的节奏一致）
  const step = isZh.value ? 2 : 1;
  let count = 0;
  const lines = text.split(/<br[^>]*>/i).map(line =>
    line
      .split(/\s+/)
      .filter(Boolean)
      .map(word => ({ text: word, i: count++ * step, gap: "" }))
  );
  // 词与词之间补回空格；两边都是中文时不补
  const words = lines.flat();
  words.forEach((word, index) => {
    const next = words[index + 1];
    if (next && !(cjk.test(word.text.slice(-1)) && cjk.test(next.text.charAt(0)))) word.gap = " ";
  });
  return { lines, label: words.map(word => word.text + word.gap).join("") };
});

const missionItems = [
  {
    title: "We Know What It’s Like",
    text: "Moving to a new country comes with a lot of unknowns. Finding a home is only one part of it. We understand the questions, the small worries, and all the details that come with starting over somewhere new.",
    textShort: "Moving abroad comes with a lot of unknowns. We understand the questions and small worries of starting over somewhere new.",
    image: "/assets/mission-sofa-book.jpg"
  },
  {
    title: "We Take Care of the Details",
    text: "From finding the right apartment to getting settled into everyday life, we’re here to make things feel easier and less overwhelming. Because when you’re far from home, the little things matter.",
    textShort: "From finding the right apartment to settling into daily life, we make things easier. When you’re far from home, the little things matter.",
    image: "/assets/mission-sunlit-kitchen.jpg"
  },
  {
    title: "We’re Here Beyond Move In",
    text: "Our support doesn’t end when you get the keys. As you settle in, meet people, and build your life here, we want USWOO to be a familiar place you can come back to.",
    textShort: "Our support doesn’t end at move-in. We want USWOO to be a familiar place you can come back to.",
    image: "https://images.unsplash.com/photo-1782061816846-80b827da8117?auto=format&fit=crop&w=900&q=80"
  }
];

const storyItems = [
  {
    title: "Find the right home",
    titleZh: "01｜更多城市<br class=m-br>更多选择",
    text: "Leasing support across multiple cities.",
    icon: '<path d="M3.5 10.2 12 3.6l8.5 6.6V20a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1Z"/><path d="M9.5 21v-6h5v6"/>'
  },
  {
    title: "Move in with ease",
    titleZh: "02｜生活琐事<br class=m-br>帮您搞定",
    text: "Furniture, Wi-Fi, and essentials.",
    icon: '<path d="M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/><path d="M3 18.5v-4.5a2 2 0 0 1 4 0V16h10v-2a2 2 0 0 1 4 0v4.5"/>'
  },
  {
    title: "Settle in with support",
    titleZh: "03｜熟悉当地<br class=m-br>更有底气",
    text: "Local services and community.",
    icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="m5.6 5.6 3.9 3.9"/><path d="m14.5 14.5 3.9 3.9"/><path d="m18.4 5.6-3.9 3.9"/><path d="m9.5 14.5-3.9 3.9"/>'
  },
  {
    title: "Stay connected",
    titleZh: undefined,
    text: "Resources that make city life easier.",
    icon: '<circle cx="12" cy="12" r="9"/><path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1Z"/>'
  }
];

const timelineItems = [
  {
    title: "Founded",
    text: "Started by helping international renters navigate the New York rental market.",
    image: "https://images.unsplash.com/photo-1643297698131-8d4c7f15ddd6?auto=format&fit=crop&w=500&q=80"
  },
  {
    title: "6,000+ Leases",
    text: "Expanded our renter network and leasing partnerships.",
    image: "https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&fit=crop&w=500&q=80"
  },
  {
    title: "Beyond New York",
    text: "Grew into New Jersey and additional U.S. cities.",
    image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=500&q=80"
  },
  {
    title: "USWOO Today",
    text: "Built a broader city-based rental and lifestyle service network.",
    image: "https://images.unsplash.com/photo-1624204386084-dd8c05e32226?auto=format&fit=crop&w=500&q=80"
  }
];

// ---- SEO ----

const absoluteUrl = useAbsoluteUrl();
usePageSeo(() => {
  const here = absoluteUrl(localePath(regionPath("about", props.region)));
  const crumbs = [
    { name: isZh.value ? "首页" : "Home", url: absoluteUrl(localePath("/")) },
    { name: tx("About Us"), url: absoluteUrl(localePath(regionPath("about"))) },
    ...(region.value ? [{ name: bi(region.value.name), url: here }] : [])
  ];
  return {
    title: `${tx("About Us")}${region.value ? ` — ${bi(region.value.name)}` : ""} | USWOO`,
    description: c("hero.sub", "USWOO helps international students and young professionals feel at home in a new city, with thoughtful support that goes beyond finding a place to live."),
    image: img("hero.images.0", "/assets/about-hero-bedroom.webp"),
    // 地区没有单独配置内容时显示的是全站默认内容：canonical 指回汇总页，避免重复收录
    canonicalPath: region.value && page.value?.resolvedFrom !== "region" ? regionPath("about") : undefined,
    jsonLd: [
      ...(region.value ? [{ "@type": "RealEstateAgent", name: "USWOO", areaServed: region.value.name.en, url: here }] : []),
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: crumb.url }))
      }
    ]
  };
});

// ---- 交互（移植自原页面脚本，行为保持一致）----

const root = ref<HTMLElement | null>(null);
const hero = ref<HTMLElement | null>(null);
const heroSlides = ref<HTMLElement | null>(null);
const navScrolled = ref(false);

const cleanups: (() => void)[] = [];

onMounted(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 首屏背景：两张照片定时左右互换（只有两张，所以来回切而不是单向循环）
  const track = heroSlides.value;
  if (track && !reduceMotion) {
    let showingSecond = false;
    const timer = window.setInterval(() => {
      showingSecond = !showingSecond;
      track.style.transform = showingSecond ? "translateX(-50%)" : "translateX(0)";
    }, 4800);
    cleanups.push(() => window.clearInterval(timer));
  }

  // 首屏滚出视口后导航变成实底
  if (hero.value) {
    const io = new IntersectionObserver(entries => entries.forEach(entry => (navScrolled.value = !entry.isIntersecting)), { threshold: 0, rootMargin: "-72px 0px 0px 0px" });
    io.observe(hero.value);
    cleanups.push(() => io.disconnect());
  }

  // 滚动出现的动效只在桌面端做（宽度 > 860 且允许动效）
  const scope = root.value;
  if (!scope || reduceMotion || window.innerWidth <= 860) return;
  const groups: [string, string, number][] = [
    [".mission-head .eyebrow", "rv-rise", 0],
    [".mission-head h2", "rv-rise", 0.12],
    [".mission-head .lede", "rv-rise", 0.24],
    [".mission-item", "rv-lift", 0],
    ["#our-story .section-head .eyebrow", "rv-rise", 0],
    ["#our-story .section-head h2", "rv-rise", 0.12],
    ["#our-story .section-head .lede", "rv-rise", 0.24],
    [".story-media-wide", "rv-wipe", 0],
    [".story-essential-item", "rv-rise", 0],
    ["#how-we-got-here .eyebrow", "rv-rise", 0],
    ["#how-we-got-here h2", "rv-rise", 0.12],
    [".timeline-track", "rv-line", 0],
    [".timeline-item", "rv-rise", 0.2],
    [".cta-band .eyebrow", "rv-rise", 0],
    [".cta-band h2", "rv-track", 0.15],
    [".cta-band .sub", "rv-rise", 0.4],
    [".cta-band .btn-row", "rv-pop", 0.6]
  ];
  const targets: HTMLElement[] = [];
  groups.forEach(([selector, kind, base]) => {
    scope.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
      if (kind === "rv-line") {
        element.classList.add("rv-line");
        element.style.opacity = "1";
        element.style.transition = "";
      } else {
        element.classList.add("rv", kind);
      }
      element.style.setProperty("--d", `${base + index * 0.12}s`);
      targets.push(element);
    });
  });
  const reveal = new IntersectionObserver(
    entries =>
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          reveal.unobserve(entry.target);
        }
      }),
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  targets.forEach(element => reveal.observe(element));
  cleanups.push(() => reveal.disconnect());
});

onBeforeUnmount(() => cleanups.splice(0).forEach(cleanup => cleanup()));
</script>
