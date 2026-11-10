<template>
  <div ref="root" class="pg pg-city-guides">
    <SiteHeader active="city-guides" scrolled />

    <!-- 原站把这两个动效开关加在 <html> 上；样式已限定在页面根元素之内，所以改加在 main 上 -->
    <main id="top" :class="{ 'cg-lead-motion': leadMotion, 'cg-motion': cardMotion }">
      <section ref="lead" class="band-raised cg-lead" :class="{ in: leadIn }">
        <div class="wrap">
          <div class="section-head centered">
            <h2 v-html="ch('lead.title', 'Know the city before you move in.', '搬进来之前<br class=m-br>先了解这座城市')" />
            <p class="lede">
              {{
                c(
                  "lead.lede",
                  "Every neighborhood has its own rhythm — schools, business districts, transit lines and the walk to your favorite coffee shop. We map it all out, so you can choose a place that actually fits your life, not just an address on a lease. Explore by school, by commute, or just by vibe."
                )
              }}
            </p>
          </div>
          <div class="cg-lead-media">
            <img :src="img('lead.image', '/assets/cg-lead-skyline.jpg')" :alt="tx('Manhattan skyline at dusk over the East River')" loading="lazy" />
          </div>
        </div>
      </section>

      <section id="explore" class="band-paper" style="padding-bottom: 0">
        <div class="wrap">
          <div class="cg-top">
            <div class="cg-intro">
              <p class="eyebrow"><span class="idx">01</span></p>
              <h1>{{ c("intro.title", "City Guides") }}</h1>
              <p class="sub">{{ c("intro.sub", "Explore the city your way.") }}</p>
              <p class="desc">{{ c("intro.desc", "Choose a city, then explore the areas, schools, business districts and lifestyles that matter to you.") }}</p>

              <button type="button" class="cg-filter-open" @click="openSheet(false)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                  <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
                  <circle cx="16" cy="7" r="2" />
                  <circle cx="8" cy="17" r="2" />
                </svg>
                {{ tx("Choose City & Explore") }}
              </button>
              <div class="cg-sheet-backdrop" @click="closeSheet" />
              <div class="cg-sheet" role="dialog" :aria-label="tx('Explore Your Way')">
                <div class="cg-sheet-head">
                  <button type="button" class="cg-sheet-x" :aria-label="both('Close', '关闭')" @click="closeSheet">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                  </button>
                  <span>{{ tx("Explore Your Way") }}</span>
                </div>
                <div class="cg-sheet-body">
                  <div class="cg-sheet-cities">
                    <p class="cg-filters-label">{{ both("City", "城市") }}</p>
                    <div class="cg-tabs">
                      <NuxtLink
                        v-for="city in cities"
                        :key="city.slug"
                        class="cg-tab"
                        :class="{ active: city.active }"
                        :to="{ path: city.path, hash: sheetCityOnly ? '#areas' : '#explore' }"
                        @click="closeSheet"
                      >
                        {{ city.label }}
                      </NuxtLink>
                    </div>
                  </div>
                  <p class="cg-filters-label">{{ tx("Explore by") }}</p>
                  <div class="cg-filters">
                    <button v-for="filter in FILTERS" :key="filter.id" type="button" class="cg-filter" :class="{ active: activeFilters.includes(filter.id) }" @click="toggleFilter(filter.id)">
                      <!-- eslint-disable-next-line vue/no-v-html -->
                      <span v-html="FILTER_ICONS[filter.id]" />
                      <span class="ftext"
                        ><strong>{{ tx(filter.title) }}</strong
                        ><span>{{ tx(filter.desc) }}</span></span
                      >
                      <span class="radio" />
                    </button>
                  </div>
                  <button type="button" class="cg-clear" @click="clearFilters">{{ tx("Clear all") }}</button>
                </div>
                <div class="cg-sheet-foot">
                  <button type="button" class="cg-sheet-done" @click="closeSheet">{{ both("Show results", "查看结果") }}</button>
                </div>
              </div>
            </div>

            <div class="cg-mappanel">
              <div class="cg-tabs">
                <NuxtLink v-for="city in cities" :key="city.slug" class="cg-tab" :class="{ active: city.active }" :to="{ path: city.path, hash: '#explore' }">
                  {{ city.label }}
                </NuxtLink>
              </div>
              <div class="cg-map">
                <div class="cg-leaflet">
                  <!-- 地图画布只在浏览器里生成；这个容器不带任何绑定，Vue 不会去动 MapLibre 放进来的节点 -->
                  <div id="cg-leaflet-container" ref="mapEl" style="position: absolute; inset: 0" />
                </div>
              </div>
              <div class="cg-legend">
                <div class="cg-legend-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>{{ tx("Neighborhood") }}
                </div>
                <div class="cg-legend-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6">
                    <path d="M22 10 12 4 2 10l10 6 10-6z" />
                    <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" /></svg
                  >{{ tx("School") }}
                </div>
                <div class="cg-legend-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6">
                    <rect x="3" y="7" width="18" height="13" rx="2" />
                    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg
                  >{{ tx("Business District") }}
                </div>
                <div class="cg-legend-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6">
                    <circle cx="12" cy="12" r="9" />
                    <text x="12" y="16" font-size="10" text-anchor="middle" fill="currentColor" stroke="none">M</text></svg
                  >{{ tx("Transit") }}
                </div>
                <div class="cg-legend-item">
                  <svg viewBox="0 0 24 24" style="stroke: none"><circle cx="12" cy="12" r="8" fill="#2F8F83" /></svg>{{ tx("Landmark") }}
                </div>
              </div>

              <!-- 地图的文字版：画布里的内容读屏软件和搜索引擎都读不到，这里按类别列出同样的点位（视觉上隐藏） -->
              <div v-if="placeGroups.length" class="cg-places-text">
                <h2>{{ both(`Places on the ${cityName} map`, `${cityName}地图上的地点`) }}</h2>
                <section v-for="group in placeGroups" :key="group.kind">
                  <h3>{{ tx(group.title) }}</h3>
                  <ul>
                    <li v-for="place in group.places" :key="place.id">
                      <strong>{{ bi(place.name) }}</strong>
                      <template v-if="bi(place.area)"> ({{ bi(place.area) }})</template>
                      <template v-if="bi(place.desc)"> — {{ bi(place.desc) }}</template>
                      <template v-if="place.address"> {{ place.address }}</template>
                    </li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div>
        <section id="areas" class="cg-areas">
          <div class="wrap">
            <div class="cg-areas-head">
              <p class="eyebrow"><span class="idx">02</span>{{ tx("NEIGHBORHOODS") }}</p>
              <h2>{{ cityEmoji }} {{ cityName }}</h2>
              <p v-if="areas.length">{{ bi(payload.intro) }}</p>
              <p v-else style="text-align: center">{{ tx("Neighborhood guide coming soon.") }}</p>
            </div>
            <div class="cg-area-pills">
              <NuxtLink v-for="city in cities" :key="city.slug" class="cg-area-pill" :class="{ active: city.active }" :to="{ path: city.path, hash: '#areas' }">
                {{ city.label }}
              </NuxtLink>
            </div>
            <button type="button" class="cg-filter-open" @click="openSheet(true)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
                <circle cx="16" cy="7" r="2" />
                <circle cx="8" cy="17" r="2" /></svg
              >{{ tx("Pick Another City") }}
            </button>

            <div v-if="areas.length" ref="areaGrid" class="cg-area-grid">
              <article v-for="(area, index) in areas" :key="index" class="cg-area" :class="{ in: cardsIn[index] }" :style="{ '--i': index % 3 }" :data-card="index">
                <div class="art"><img :src="area.image?.url" :alt="bi(area.name)" /></div>
                <div class="body">
                  <h3>
                    <span class="em">{{ area.emoji }}</span
                    >{{ bi(area.name) }}
                  </h3>
                  <p class="cg-full">{{ bi(area.text) }}</p>
                  <p v-if="bi(area.short)" class="cg-short">{{ bi(area.short) }}</p>
                  <div class="tags">
                    <span v-for="(tag, tagIndex) in area.tags ?? []" :key="tagIndex">{{ bi(tag) }}</span>
                  </div>
                </div>
              </article>
              <article
                v-if="closing"
                class="cg-area cg-area-note"
                :class="{ 'cg-note-mobile-hide': closing.hideOnMobile, wide: areas.length % 3 === 0, in: cardsIn[areas.length] }"
                :style="{ '--i': areas.length % 3 }"
                :data-card="areas.length"
              >
                <div class="art"><img :src="closing.image?.url" alt="" /></div>
                <div class="body">
                  <h3>
                    <span class="em">{{ closing.emoji || "✨" }}</span
                    >{{ bi(closing.title) || tx("Found your area?") }}
                  </h3>
                  <p class="cg-full">{{ bi(closing.text) }}</p>
                  <p class="cg-short">{{ bi(closing.short) || tx("Once you know your area, we can help with the rest, from apartment search to move-in essentials.") }}</p>
                  <NuxtLink class="btn" :to="localePath('/contact')">{{ tx("Talk to USWOO") }}</NuxtLink>
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>

      <section id="cta" class="band-paper" style="padding-top: 0">
        <div class="wrap">
          <div class="cg-switch">
            <div class="cg-switch-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6">
                <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.4" />
              </svg>
            </div>
            <div class="cg-switch-text">
              <strong>{{ c("switch.title", "Moving to a different city?") }}</strong>
              <span>{{ c("switch.text", "Switch cities above to explore more areas and find your place.") }}</span>
            </div>
            <a class="btn btn-outline on-paper" href="#explore">{{ tx("Explore Other Cities") }}</a>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import "~/assets/css/pages/city-guides.css";
import "~/assets/css/pages/city-guides.extra.css";
import type { Guide, GuidePlace } from "~~/shared/types/api";
import type { GuideFilter, GuidePayload } from "./cityGuide.types";
import { createGuideMap, type GuideMapHandle } from "./cityGuide/map";

/** region 不传 = 汇总页 /city-guides，显示纽约的内容并把 canonical 指向纽约的地区页 */
const props = defineProps<{ region?: string }>();

const { tx, bi, isZh } = useTx();
const localePath = useLocalePath();
const api = useApi();
const { region, regions } = await useRegion(props.region);
const slug = props.region ?? "new-york";
const { c, ch, img } = await usePageContent("city-guides", props.region);

/** 字典里没有的界面文案：直接给出两种语言 */
const both = (english: string, chinese: string) => (isZh.value ? chinese : english);

// ---- 数据 ----

const { data: guide, error } = await useAsyncData(`guide:${slug}`, async () => {
  const published = await orNull(api<Guide>(`/guides/${slug}`));
  if (published || !import.meta.dev) return published;
  // 【仅本地开发】CMS 里还没导入这个地区的 City Guide 时，用 seed/guides/<region>.json 顶上（见 server/routes/_dev/guide/[region].get.ts）。
  // 正式构建里 import.meta.dev 为 false，这一段会被整体去掉。
  return await $fetch<Guide>(`/_dev/guide/${slug}`).catch(() => null);
});
// 没发布就是真实的 404；接口本身出错则如实报错，不伪装成“页面不存在”
if (!guide.value) throw createError(error.value ? { statusCode: 502, statusMessage: "Bad Gateway", fatal: true } : { statusCode: 404, statusMessage: "Page Not Found", fatal: true });

const payload = computed(() => (guide.value?.payload ?? {}) as Partial<GuidePayload>);
const areas = computed(() => payload.value.areas ?? []);
const closing = computed(() => payload.value.closing ?? null);
const places = computed<GuidePlace[]>(() => guide.value?.places ?? []);

/** 标题里的城市：地区页用地区自己的名称（占位地区显示的是别处复制来的内容，名称仍是它自己的） */
const cityName = computed(() => (region.value ? bi(region.value.name) : bi(payload.value.cityName)));
const cityEmoji = computed(() => (region.value ? region.value.emoji : (payload.value.emoji ?? "")));

/** 城市切换沿用原站的顺序；每个城市现在是独立的网址 */
const CITY_ORDER = ["new-york", "los-angeles", "washington-dc", "chicago", "philadelphia", "boston"];
const order = (value: string) => (CITY_ORDER.includes(value) ? CITY_ORDER.indexOf(value) : CITY_ORDER.length);
const cities = computed(() =>
  [...regions.value]
    .sort((a, b) => order(a.slug) - order(b.slug))
    .map(item => ({ slug: item.slug, label: `${item.emoji} ${bi(item.name)}`.trim(), active: item.slug === slug, path: localePath(regionPath("city-guide", item.slug)) }))
);

const FILTER_ICONS: Record<GuideFilter, string> = {
  neighborhood: '<svg viewBox="0 0 24 24" fill="none" stroke="#141414" stroke-width="1.6" style="width:20px;height:20px"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>',
  school:
    '<svg viewBox="0 0 24 24" fill="none" stroke="#141414" stroke-width="1.6" style="width:20px;height:20px"><path d="M22 10 12 4 2 10l10 6 10-6z"/><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/></svg>',
  business:
    '<svg viewBox="0 0 24 24" fill="none" stroke="#141414" stroke-width="1.6" style="width:20px;height:20px"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  commute:
    '<svg viewBox="0 0 24 24" fill="none" stroke="#141414" stroke-width="1.6" style="width:20px;height:20px"><rect x="5" y="3" width="14" height="14" rx="3"/><circle cx="8.5" cy="21" r="1.2"/><circle cx="15.5" cy="21" r="1.2"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
};
const FILTERS: { id: GuideFilter; title: string; desc: string }[] = [
  { id: "neighborhood", title: "Neighborhood", desc: "Explore popular areas" },
  { id: "school", title: "School", desc: "Universities & campuses" },
  { id: "business", title: "Business District", desc: "Work hubs & commercial areas" },
  { id: "commute", title: "Commute", desc: "Transit & commute time" }
];

/** 地图文字版的分组，顺序与图例一致 */
const PLACE_GROUPS: { kind: GuidePlace["kind"]; title: string }[] = [
  { kind: "neighborhood", title: "Neighborhood" },
  { kind: "school", title: "School" },
  { kind: "business", title: "Business District" },
  { kind: "commute", title: "Commute" },
  { kind: "landmark", title: "Landmark" },
  { kind: "company", title: "Major Employer" }
];
const placeGroups = computed(() => PLACE_GROUPS.map(group => ({ ...group, places: places.value.filter(place => place.kind === group.kind) })).filter(group => group.places.length));

// ---- SEO ----

const absoluteUrl = useAbsoluteUrl();
usePageSeo(() => {
  const name = cityName.value;
  const pageUrl = absoluteUrl(localePath(regionPath("city-guide", slug)));
  return {
    title: bi(payload.value.seo?.title) || both(`${name} City Guide | USWOO`, `${name}城市指南 | USWOO`),
    description: bi(payload.value.seo?.description) || bi(payload.value.intro) || c("intro.desc", "Choose a city, then explore the areas, schools, business districts and lifestyles that matter to you."),
    image: areas.value[0]?.image?.url || "/assets/cg-lead-skyline.jpg",
    noindex: guide.value?.isPlaceholder ?? false,
    canonicalPath: props.region ? undefined : regionPath("city-guide", "new-york"),
    jsonLd: [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: both("Home", "首页"), item: absoluteUrl(localePath("/")) },
          { "@type": "ListItem", position: 2, name: tx("City Guides"), item: absoluteUrl(localePath("/city-guides")) },
          { "@type": "ListItem", position: 3, name, item: pageUrl }
        ]
      },
      {
        "@type": "RealEstateAgent",
        name: "USWOO",
        url: absoluteUrl(localePath("/")),
        image: absoluteUrl("/assets/uswoo-hero-poster.jpg"),
        areaServed: { "@type": "City", name }
      },
      {
        "@type": "ItemList",
        name: both(`${name} neighborhoods`, `${name}社区指南`),
        itemListElement: areas.value.map((area, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: bi(area.name),
          description: bi(area.short) || bi(area.text)
        }))
      }
    ]
  };
});

// ---- 交互（移植自原页面脚本，行为保持一致）----

const root = ref<HTMLElement | null>(null);
const lead = ref<HTMLElement | null>(null);
const mapEl = ref<HTMLElement | null>(null);
const areaGrid = ref<HTMLElement | null>(null);
const leadMotion = ref(false);
const leadIn = ref(false);
const cardMotion = ref(false);
/** 每张区域卡片是否已滚入视口（服务端与无动效环境下不起作用，卡片直接可见） */
const cardsIn = ref<boolean[]>([]);
/** 手机上的筛选面板是从「Pick Another City」打开的：只显示城市，选完回到区域卡片 */
const sheetCityOnly = ref(false);

const activeFilters = ref<GuideFilter[]>(["neighborhood"]);
let guideMap: GuideMapHandle | null = null;

function toggleFilter(id: GuideFilter) {
  activeFilters.value = activeFilters.value.includes(id) ? activeFilters.value.filter(item => item !== id) : [...activeFilters.value, id];
  guideMap?.paint();
}
function clearFilters() {
  activeFilters.value = [];
  guideMap?.paint();
}

// 面板的显隐由 body 上的类控制（样式表里就是这么写的）
function openSheet(cityOnly: boolean) {
  sheetCityOnly.value = cityOnly;
  document.body.classList.toggle("cg-sheet-city-only", cityOnly);
  document.body.classList.add("cg-sheet-open");
}
function closeSheet() {
  document.body.classList.remove("cg-sheet-open");
}

const cleanups: (() => void)[] = [];

onMounted(() => {
  const motionOk = "IntersectionObserver" in window && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // 顶部导语：进入视口时文字上浮、图片展开
  if (motionOk && lead.value) {
    leadMotion.value = true;
    const io = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            leadIn.value = true;
            io.disconnect();
          }
        }),
      { threshold: 0.25 }
    );
    io.observe(lead.value);
    cleanups.push(() => io.disconnect());
  }

  // 区域卡片：滚入视口时逐张出现
  if (motionOk && areaGrid.value) {
    const io = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            cardsIn.value[Number((entry.target as HTMLElement).dataset.card)] = true;
            io.unobserve(entry.target);
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    areaGrid.value.querySelectorAll(".cg-area").forEach(card => io.observe(card));
    cardMotion.value = true;
    cleanups.push(() => io.disconnect());
  }

  // 从别的页面带着 #explore 直接打开时落在地图面板上；图片加载会让布局继续变化，所以多对齐几次。
  // 站内切换城市由路由处理锚点，不走这里，免得把用户已经滚动的位置拉回去。
  if (useNuxtApp().isHydrating && location.hash === "#explore") {
    const go = () => {
      const target = document.getElementById("explore");
      if (target) window.scrollTo(0, target.getBoundingClientRect().top + window.pageYOffset - 8);
    };
    const timers = [0, 300, 900, 1800].map(delay => setTimeout(go, delay));
    window.addEventListener("load", go, { once: true });
    cleanups.push(() => {
      timers.forEach(timer => clearTimeout(timer));
      window.removeEventListener("load", go);
    });
  }

  // 地图：MapLibre 只在这个页面按需加载
  const config = payload.value.map;
  if (mapEl.value && root.value && config?.center && config.bounds) {
    guideMap = createGuideMap({
      container: mapEl.value,
      tipHost: root.value,
      config,
      places: places.value,
      filters: () => activeFilters.value,
      tx,
      bi,
      isZh: () => isZh.value
    });
  }
});

onBeforeUnmount(() => {
  cleanups.splice(0).forEach(cleanup => cleanup());
  guideMap?.destroy();
  guideMap = null;
  document.body.classList.remove("cg-sheet-open", "cg-sheet-city-only");
});
</script>
