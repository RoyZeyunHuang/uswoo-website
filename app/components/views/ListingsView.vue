<template>
  <div class="pg pg-listings">
    <SiteHeader active="listings" scrolled />

    <main id="top">
      <!-- 首屏只保留大标题：不放小标题、说明文字和城市筛选 -->
      <section v-if="on('hero')" class="ls-hero">
        <div class="wrap">
          <h1>
            <!-- 标题各地区可以不同（例如纽约是「独家房源」，其他城市是「重点推荐」）：在 CMS 里给该地区单独设置 hero 的标题即可 -->
            {{ c("hero.titleLead") }}<template v-if="!isZh">{{ " " }}</template><span class="pink">{{ c("hero.titleAccent") }}</span>
          </h1>
          <!-- 城市筛选：每个城市是自己的地区页（有独立网址，可收录）；高亮当前所在地区 -->
          <nav v-if="regions.length" class="ls-filters" :aria-label="tx('Filter by city')">
            <NuxtLink v-for="item in cityOptions" :key="item.slug" class="ls-chip" :class="{ on: props.region === item.slug }" :to="localePath(regionPath('listings', item.slug))">{{ bi(item.name) }}</NuxtLink>
          </nav>
          <!-- 手机上的筛选：一个按钮，点开在原位展开面板（城市、价格区间、户型）；桌面隐藏，见 listings.extra.css -->
          <div v-if="regions.length" class="ls-mfilter">
            <button type="button" class="ls-filter-open" :aria-expanded="filterOpen" @click="filterOpen = !filterOpen">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
                <circle cx="16" cy="7" r="2" />
                <circle cx="8" cy="17" r="2" />
              </svg>
              {{ tx("Cities & filters") }}<span v-if="activeCount" class="ls-filter-count">{{ activeCount }}</span>
            </button>
            <!-- 筛选弹窗：居中的卡片，背后是半透明遮罩，点遮罩或 × 关闭 -->
            <div class="ls-modal" :class="{ open: filterOpen }" @click.self="filterOpen = false">
            <div class="ls-fpanel" role="dialog" aria-modal="true" :aria-label="tx('Filters')">
              <div class="ls-fhead">
                <button type="button" class="ls-fx" :aria-label="tx('Close')" @click="filterOpen = false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                </button>
                <span>{{ tx("Filters") }}</span>
              </div>
              <div class="ls-fbody">
              <p class="ls-flabel">{{ tx("City") }}</p>
              <div class="ls-fgrid">
                <NuxtLink v-for="item in cityOptions" :key="item.slug" class="ls-fopt" :class="{ on: props.region === item.slug }" :to="localePath(regionPath('listings', item.slug))">{{ bi(item.name) }}</NuxtLink>
              </div>
              <!-- 价格区间：柱状图显示各价位的楼盘数，下面一根双滑块，再下面是可直接输入的最低 / 最高价 -->
              <div class="ls-fsec">
                <p class="ls-flabel">{{ tx("Price range") }}</p>
                <p class="ls-fhint">{{ tx("Monthly rent, starting price") }}</p>
                <div class="ls-hist" aria-hidden="true">
                  <span v-for="(bar, index) in histogram" :key="index" :class="{ out: !bar.inRange }" :style="{ height: `${bar.height ? Math.max(bar.height, 14) : 0}%` }" />
                </div>
                <div class="ls-slider">
                  <div class="ls-slider-fill" :style="{ left: `${sliderPct(priceMin)}%`, right: `${100 - sliderPct(priceMax)}%` }" />
                  <input type="range" :min="priceBounds[0]" :max="priceBounds[1]" step="50" :value="priceMin" :aria-label="tx('Minimum')" @input="setMin(Number(($event.target as HTMLInputElement).value))" />
                  <input type="range" :min="priceBounds[0]" :max="priceBounds[1]" step="50" :value="priceMax" :aria-label="tx('Maximum')" @input="setMax(Number(($event.target as HTMLInputElement).value))" />
                </div>
                <div class="ls-pricebox">
                  <label><span>{{ tx("Minimum") }}</span><input type="text" inputmode="numeric" :value="fmt(priceMin)" @change="setMin(parsePrice($event))" /></label>
                  <label><span>{{ tx("Maximum") }}</span><input type="text" inputmode="numeric" :value="fmt(priceMax) + (priceMax >= priceBounds[1] ? '+' : '')" @change="setMax(parsePrice($event))" /></label>
                </div>
              </div>

              <!-- 房间：卧室、卫生间各一个 −/+ 步进器，0 是「不限」，选 N 表示至少 N -->
              <div class="ls-fsec">
                <p class="ls-flabel">{{ tx("Rooms") }}</p>
                <div v-for="row in ROOM_ROWS" :key="row.key" class="ls-step">
                  <span>{{ tx(row.label) }}</span>
                  <div class="ls-step-ctl">
                    <button type="button" :disabled="rooms[row.key] === 0" :aria-label="tx('Decrease')" @click="rooms[row.key]--">−</button>
                    <b>{{ rooms[row.key] ? `${rooms[row.key]}+` : tx("Any") }}</b>
                    <button type="button" :disabled="rooms[row.key] >= row.max" :aria-label="tx('Increase')" @click="rooms[row.key]++">+</button>
                  </div>
                </div>
              </div>

              <!-- 设施：多选，选中的设施楼盘都要有 -->
              <div class="ls-fsec">
                <p class="ls-flabel">{{ tx("Amenities") }}</p>
                <div class="ls-chips">
                  <button v-for="item in AMENITY_OPTIONS" :key="item.label" type="button" class="ls-fchip" :class="{ on: amenities.includes(item.label) }" :aria-pressed="amenities.includes(item.label)" @click="toggleAmenity(item.label)">
                    <AmenityIcon :label="item.label" />{{ tx(item.label) }}
                  </button>
                </div>
              </div>

              </div>
              <div class="ls-ffoot">
                <button type="button" class="ls-freset" :disabled="!activeCount" @click="resetFilters">{{ tx("Clear all") }}</button>
                <button type="button" class="ls-fshow" @click="filterOpen = false">{{ tx("Show {n} buildings").replace("{n}", String(shownBuildings.length)) }}</button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      <section class="ls-grid-sec">
        <div class="wrap">
          <!-- 独家楼盘：内容在 CMS 的 buildings 里；「全部」页显示所有，地区页只显示该地区的 -->
          <div v-if="buildings.length" class="ls-dev">
            <p class="eyebrow">{{ c("buildings.eyebrow") }}</p>
            <div class="ls-dev-grid">
              <NuxtLink v-for="item in shownBuildings" :key="item.slug" class="ls-dev-card" :to="localePath(`/listings/building/${item.slug}`)">
                <div class="ls-dev-media">
                  <img v-if="cover(item)" :src="cover(item)" :alt="text(item, 'name')" :style="item.position ? { objectPosition: item.position } : undefined" loading="lazy" />
                  <span v-else class="ls-dev-ph" aria-hidden="true">{{ text(item, "name") }}</span>
                  <span v-if="text(item, 'tag')" class="ls-tag">{{ text(item, "tag") }}</span>
                </div>
                <div class="ls-dev-body">
                  <div>
                    <h3>{{ text(item, "name") }}</h3>
                    <p>{{ text(item, "state") || regionLabel(item.region) }}</p>
                  </div>
                  <span class="ls-dev-cta">{{ c("buildings.cardCta") }} <span aria-hidden="true">→</span></span>
                </div>
              </NuxtLink>
            </div>
            <p v-if="!shownBuildings.length" class="ls-empty" style="display: block">{{ tx("No buildings match these filters.") }}</p>
          </div>

          <!-- 这个地区还没有楼盘时的「即将上线」占位卡片 -->
          <div v-if="placeholders" class="ls-dev">
            <div class="ls-dev-grid">
              <div v-for="n in 3" :key="n" class="ls-dev-card ls-dev-soon" aria-hidden="true">
                <div class="ls-dev-media"><span class="ls-dev-ph">{{ regionLabel(props.region!) }}</span></div>
                <div class="ls-dev-body">
                  <div><h3>{{ c("buildings.comingSoon") }}</h3><p>{{ regionLabel(props.region!) }}</p></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 列表页只展示合作的大楼 / 开发商；具体房源在点进楼盘之后 -->
          <p v-if="!buildings.length && !placeholders" id="lsEmpty" class="ls-empty" style="display: block">{{ c("empty") }}</p>
          <p class="ls-note">{{ c("disclaimer") }}</p>
        </div>
      </section>

      <section v-if="on('cta')" class="band-raised cta-band">
        <div class="wrap">
          <p class="eyebrow"><span class="idx">{{ no("cta") }}</span> {{ c("cta.eyebrow") }}</p>
          <h2>{{ c("cta.title") }}</h2>
          <p class="lede">
            {{ c("cta.lede") }}
          </p>
          <div class="btn-row">
            <NuxtLink class="btn btn-pink" :to="localePath(regionPath('contact', props.region))">{{ c("cta.button") }}</NuxtLink>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import "~/assets/css/pages/listings.css";
import "~/assets/css/pages/listings.extra.css";

/** 房源列表：/listings（全部地区）与 /{region}/listings（单个地区）共用。 */
const props = defineProps<{ region?: string }>();

const { region, regions } = await useRegion(props.region);
const { tx, bi, isZh } = useTx();
const localePath = useLocalePath();
const absoluteUrl = useAbsoluteUrl();
// 页面上的固定文案：地区页用该地区的版本（没有单独配置的部分沿用全站默认）
const { c, raw, on } = await usePageContent("listings", props.region);
const { text, cover, price: priceOf, maxBeds, maxBaths, amenityNames } = await useBuildingFields();
const no = useBlockNumbers(["cta"] as const, on);

// 独家楼盘：可以在 CMS 里整体隐藏（buildings.show）；「全部」页显示所有，地区页只显示该地区的
const allBuildings = await useBuildings(props.region);
const buildings = computed(() => (on("buildings") ? buildingsFor(allBuildings.value, props.region) : []));
const placeholders = computed(() => Boolean(props.region) && on("buildings") && !buildings.value.length);
// 手机上的筛选面板：价格区间、户型在当前列表里再筛一遍（城市是各自的网址）
const filterOpen = ref(false);
// 城市选项的顺序：CMS 里 filters.cityOrder 列出的地区按那里的顺序排在前面，没列出的按地区接口的顺序接在后面
const cityOptions = computed(() => {
  const order = raw<string[]>("filters.cityOrder") ?? [];
  const rank = (slug: string) => (order.includes(slug) ? order.indexOf(slug) : order.length);
  return regions.value.map((item, index) => ({ item, index })).sort((a, b) => rank(a.item.slug) - rank(b.item.slug) || a.index - b.index).map(entry => entry.item);
});
// 弹窗打开时锁住页面滚动
watch(filterOpen, (open) => {
  if (import.meta.client) document.body.style.overflow = open ? "hidden" : "";
});
onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = "";
});
const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

// 价格区间：范围取当前列表里楼盘起租价的最低到最高（向外取整到 500），滑块和柱状图都用它；没有楼盘标价时不显示柱子
const HIST_BARS = 24;
const prices = computed(() => buildings.value.map(priceOf).filter(value => value > 0));
const priceBounds = computed<[number, number]>(() => {
  if (!prices.value.length) return [0, 500];
  const lo = Math.floor(Math.min(...prices.value) / 500) * 500;
  const hi = Math.ceil(Math.max(...prices.value) / 500) * 500;
  return [lo, hi > lo ? hi : lo + 500];
});
const priceMin = ref(priceBounds.value[0]);
const priceMax = ref(priceBounds.value[1]);
// 换城市时楼盘变了，价格范围跟着重置
watch(priceBounds, ([lo, hi]) => {
  priceMin.value = lo;
  priceMax.value = hi;
});
const setMin = (value: number) => (priceMin.value = Math.min(Math.max(value || priceBounds.value[0], priceBounds.value[0]), priceMax.value));
const setMax = (value: number) => (priceMax.value = Math.max(Math.min(value || priceBounds.value[1], priceBounds.value[1]), priceMin.value));
const parsePrice = (event: Event) => Number((event.target as HTMLInputElement).value.replace(/[^\d]/g, ""));
const sliderPct = (value: number) => ((value - priceBounds.value[0]) / (priceBounds.value[1] - priceBounds.value[0])) * 100;
// 柱状图：把价格范围分成 24 格，每格数有几栋楼（最高的一格为满高）；选中范围外的柱子变灰
const histogram = computed(() => {
  const [lo, hi] = priceBounds.value;
  const step = (hi - lo) / HIST_BARS;
  const counts = Array.from({ length: HIST_BARS }, () => 0);
  for (const value of prices.value) counts[Math.min(HIST_BARS - 1, Math.floor((value - lo) / step))]!++;
  const top = Math.max(1, ...counts);
  return counts.map((count, index) => ({ height: (count / top) * 100, inRange: lo + step * (index + 1) > priceMin.value && lo + step * index < priceMax.value }));
});

// 房间：0 = 不限，N = 至少 N；上限取当前列表里最大的值
const ROOM_ROWS = computed(() => [
  { key: "beds" as const, label: "Bedrooms", max: Math.max(1, ...buildings.value.map(maxBeds)) },
  { key: "baths" as const, label: "Bathrooms", max: Math.max(1, ...buildings.value.map(maxBaths)) }
]);
const rooms = reactive({ beds: 0, baths: 0 });

// 设施：按设施名里的关键词匹配楼盘的设施
const AMENITY_OPTIONS = [
  { label: "Fitness center", re: /fitness|gym/i },
  { label: "Rooftop terrace", re: /roof|terrace/i },
  { label: "Coworking spaces", re: /cowork/i },
  { label: "Outdoor pool", re: /pool/i },
  { label: "Pet friendly", re: /pet|dog/i },
  { label: "Doorman", re: /doorman|concierge/i },
  { label: "Resident lounge", re: /lounge/i }
];
const amenities = ref<string[]>([]);
const toggleAmenity = (label: string) => (amenities.value = amenities.value.includes(label) ? amenities.value.filter(item => item !== label) : [...amenities.value, label]);

const activeCount = computed(
  () => (priceMin.value > priceBounds.value[0] || priceMax.value < priceBounds.value[1] ? 1 : 0) + (rooms.beds ? 1 : 0) + (rooms.baths ? 1 : 0) + amenities.value.length
);
const resetFilters = () => {
  priceMin.value = priceBounds.value[0];
  priceMax.value = priceBounds.value[1];
  rooms.beds = 0;
  rooms.baths = 0;
  amenities.value = [];
};
const shownBuildings = computed(() =>
  buildings.value.filter((item) => {
    const price = priceOf(item);
    if (price && (price < priceMin.value || price > priceMax.value)) return false;
    if (maxBeds(item) < rooms.beds || maxBaths(item) < rooms.baths) return false;
    const names = amenityNames(item);
    return amenities.value.every(label => names.some(name => AMENITY_OPTIONS.find(option => option.label === label)?.re.test(name)));
  })
);
const regionLabel = (slug: string) => {
  const item = regions.value.find(entry => entry.slug === slug);
  return item ? bi(item.name) : "";
};

usePageSeo(() => {
  const name = region.value ? bi(region.value.name) : "";
  const path = regionPath("listings", region.value?.slug);
  const crumbs = [
    { "@type": "ListItem", position: 1, name: tx("Home"), item: absoluteUrl(localePath("/")) },
    { "@type": "ListItem", position: 2, name: c("name"), item: absoluteUrl(localePath("/listings")) }
  ];
  if (region.value) crumbs.push({ "@type": "ListItem", position: 3, name, item: absoluteUrl(localePath(path)) });

  const jsonLd: Record<string, unknown>[] = [{ "@type": "BreadcrumbList", itemListElement: crumbs }];

  return {
    title: region.value ? c("seo.regionTitle").replace("{region}", name) : c("seo.title"),
    description: region.value ? c("seo.regionDescription").replace("{region}", name) : c("seo.description"),
    keywords: c("seo.keywords"),
    // 还没有房源的地区页只有一句占位说明，不让搜索引擎收录
    noindex: Boolean(region.value) && !buildings.value.length,
    jsonLd
  };
});
</script>
