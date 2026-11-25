<template>
  <div class="pg pg-listings pg-listing-detail pg-building">
    <SiteHeader active="listings" scrolled />

    <main id="top">
      <section class="ld-main">
        <div class="wrap">
          <!-- 面包屑：房源 › 楼盘名（对应参考页顶部的路径） -->
          <nav class="bd-crumbs" :aria-label="tx('Breadcrumb')">
            <NuxtLink :to="localePath('/listings')">{{ c("name") }}</NuxtLink>
            <span aria-hidden="true">›</span>
            <template v-if="regionName">
              <NuxtLink :to="localePath(regionPath('listings', building.region))">{{ regionName }}</NuxtLink>
              <span aria-hidden="true">›</span>
            </template>
            <span aria-current="page">{{ name }}</span>
          </nav>

          <!-- 相册：一张大图加最多四张小图，点任意一张打开全屏查看（版式与房源详情页一致） -->
          <div v-if="photos.length" class="ld-mosaic" :class="{ single: photos.length === 1 }" :data-count="Math.min(photos.length, 5)" role="group" :aria-label="name">
            <button v-for="(photo, index) in shown" :key="photo" type="button" class="ld-tile" :class="{ main: index === 0 }" :aria-label="tx('Show photo {n}').replace('{n}', String(index + 1))" @click="openViewer(index)">
              <img :src="photo" :alt="`${name} ${index + 1}`" :loading="index === 0 ? 'eager' : 'lazy'" decoding="async" />
              <span v-if="index === 0 && tag" class="ls-tag">{{ tag }}</span>
              <!-- 手机上只显示一张大图，用这个按钮提示可以点开看全部照片（桌面上隐藏） -->
              <span v-if="index === 0 && photos.length > 1" class="bd-photos-btn">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                {{ c("detail.allPhotos") }} ({{ photos.length }})
              </span>
              <span v-if="index === shown.length - 1 && photos.length > 1" class="ld-allphotos">{{ c("detail.allPhotos") }} <span aria-hidden="true">›</span></span>
            </button>
          </div>

          <!-- 手机版相册：所有照片横向排开，左右滑动切换（桌面隐藏，见 listings.extra.css）；点一张打开全屏查看 -->
          <div v-if="photos.length" class="bd-swipe-wrap">
            <div class="bd-swipe" role="group" :aria-label="name" @scroll.passive="onSwipe">
              <button v-for="(photo, index) in photos" :key="photo" type="button" class="bd-swipe-slide" :aria-label="tx('Show photo {n}').replace('{n}', String(index + 1))" @click="openViewer(index)">
                <img :src="photo" :alt="`${name} ${index + 1}`" :loading="index === 0 ? 'eager' : 'lazy'" decoding="async" draggable="false" />
              </button>
            </div>
            <span v-if="tag" class="ls-tag">{{ tag }}</span>
            <span v-if="photos.length > 1" class="bd-swipe-count" aria-live="polite">{{ swipeIndex + 1 }} / {{ photos.length }}</span>
          </div>

          <div class="ld-head">
            <div class="ld-head-main">
              <p v-if="tag" class="eyebrow">{{ tag }}</p>
              <!-- 名称和起租价同一行，地址与户型合并成一行小字 -->
              <div class="bd-titlerow">
                <h1>{{ name }}</h1>
                <div v-if="startingPrice" class="ld-price">
                  <small class="bd-from">{{ c("building.startingAt") }}</small> ${{ startingPrice.toLocaleString("en-US") }}<small>{{ c("detail.perMonth") }}</small>
                </div>
              </div>
              <div class="ld-summary bd-meta">
                <span class="bd-addr">{{ text(building, "address") || regionName }}</span>
                <span v-for="i in list(`${at}.summary`)" :key="i">{{ c(`${at}.summary.${i}`) }}</span>
              </div>
            </div>
          </div>

          <!-- 吸顶的分区导航 + 咨询按钮；手机上只留按钮 -->
          <div class="bd-subnav">
            <nav class="bd-subnav-links" :aria-label="tx('On this page')">
              <a href="#bd-overview" :class="{ on: activeSection === 'bd-overview' }">{{ c("detail.overview") }}</a>
              <a v-if="amenityGroups.length" href="#bd-amenities" :class="{ on: activeSection === 'bd-amenities' }">{{ c("building.amenitiesTitle") }}</a>
              <a v-if="others.length" href="#bd-more" :class="{ on: activeSection === 'bd-more' }">{{ c("building.moreTitle") }}</a>
            </nav>
            <div class="bd-subnav-cta">
              <NuxtLink class="btn btn-outline on-paper" :to="contactTo">{{ c("building.contact") }}</NuxtLink>
              <NuxtLink class="btn btn-pink" :to="contactTo">{{ c("building.tour") }}</NuxtLink>
            </div>
          </div>

          <div id="bd-overview" class="ld-overview bd-section">
            <h2>{{ c("detail.overview") }}</h2>
            <dl>
              <div v-for="row in overview" :key="row.key">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </div>
            </dl>

            <!-- 楼盘介绍并在概览里：CMS 里该楼盘的 description，空行分段；太长时折叠 -->
            <div v-if="paragraphs.length" class="bd-about">
              <h3>{{ c("building.descriptionTitle") }}</h3>
              <div class="bd-prose" :class="{ clamped: longText && !expanded }">
                <p v-for="(text, index) in paragraphs" :key="index">{{ text }}</p>
              </div>
              <button v-if="longText" type="button" class="bd-more-btn" :aria-expanded="expanded" @click="expanded = !expanded">{{ expanded ? tx("Show less") : tx("Read more") }}</button>
            </div>
          </div>

          <!-- 设施与服务：CMS 里该楼盘的 amenities，每组一个小标题加若干条 -->
          <div v-if="amenityGroups.length" id="bd-amenities" class="bd-section bd-amenities">
            <h2>{{ c("building.amenitiesTitle") }}</h2>
            <div class="bd-amenity-grid">
              <div v-for="group in amenityGroups" :key="group.path">
                <h3>{{ c(`${group.path}.title`) }}</h3>
                <ul>
                  <li v-for="item in group.items" :key="item.path">
                    <span class="bd-amenity-ico"><AmenityIcon :label="item.icon" /></span>
                    <span>{{ c(item.path) }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 其他楼盘（同一个 CMS 列表里除了本栋以外的） -->
          <div v-if="others.length" id="bd-more" class="bd-section bd-others">
            <h2>{{ c("building.moreTitle") }}</h2>
            <div class="ls-dev-grid">
              <NuxtLink v-for="item in others" :key="item.slug" class="ls-dev-card" :to="localePath(`/listings/building/${item.slug}`)">
                <div class="ls-dev-media">
                  <img v-if="cover(item)" :src="cover(item)" :alt="text(item, 'name')" :style="item.position ? { objectPosition: item.position } : undefined" loading="lazy" />
                  <span v-if="text(item, 'tag')" class="ls-tag">{{ text(item, "tag") }}</span>
                </div>
                <div class="ls-dev-body">
                  <div>
                    <h3>{{ text(item, "name") }}</h3>
                    <p>{{ text(item, "state") }}</p>
                  </div>
                  <span class="ls-dev-cta">{{ c("buildings.cardCta") }} <span aria-hidden="true">→</span></span>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 全屏查看：键盘 ← → 切换，Esc 关闭 -->
    <div v-if="viewer !== null" class="ld-viewer" role="dialog" aria-modal="true" :aria-label="name" @click.self="closeViewer">
      <button type="button" class="ld-viewer-close" :aria-label="tx('Close')" @click="closeViewer">×</button>
      <button v-if="photos.length > 1" type="button" class="ld-arrow prev" :aria-label="tx('Previous photo')" @click="step(-1)">‹</button>
      <img :src="photos[viewer]" :alt="name" />
      <button v-if="photos.length > 1" type="button" class="ld-arrow next" :aria-label="tx('Next photo')" @click="step(1)">›</button>
      <span class="ld-count" aria-live="polite">{{ viewer + 1 }} / {{ photos.length }}</span>
    </div>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import "~/assets/css/pages/listings.css";
import "~/assets/css/pages/listing-detail.css";
import "~/assets/css/pages/listings.extra.css";

/** 楼盘页：介绍这栋楼，版式与房源详情页一致（相册、标题、概览表）。楼盘内容全部来自 CMS「房源页」的 buildings.items。 */
const props = defineProps<{ building: BuildingRef }>();
const { tx, bi } = useTx();
const { c, img, raw, list } = await usePageContent("listings");

const at = computed(() => props.building.path);
const { text, cover } = await useBuildingFields();
const name = computed(() => text(props.building, "name"));
const tag = computed(() => text(props.building, "tag"));
const startingPrice = computed(() => Number(raw(`${at.value}.startingPrice`)) || 0);
const yearBuilt = computed(() => Number(raw(`${at.value}.yearBuilt`)) || 0);
const localePath = useLocalePath();
const regions = await useRegions();
const site = await useSite();
// 告诉右下角的 AI 浮窗当前在看哪栋楼（浮窗里显示"正在看：xxx"标签）；用原始值，不带 CMS 编辑预览的标记
const viewing = useState<{ slug: string; name: string } | null>("ai-chat-viewing", () => null);
const plainName = () => {
  const leaf = raw<{ en?: string; zh?: string } | string>(`${at.value}.name`);
  return typeof leaf === "string" ? leaf : bi(leaf);
};
viewing.value = { slug: props.building.slug, name: plainName() };
onBeforeUnmount(() => (viewing.value = null));
const contactTo = computed(() => ({ path: localePath(regionPath("contact", props.building.region)), query: { building: props.building.slug } }));

// 楼盘介绍：description 按换行分段
const paragraphs = computed(() =>
  c(`${at.value}.description`)
    .split(/\n+/)
    .map(text => text.trim())
    .filter(Boolean)
);
const expanded = ref(false);
const longText = computed(() => paragraphs.value.join("").length > 420);

// 设施与服务：amenities.N.title / amenities.N.items.M。图标按设施的原文挑（不带编辑预览的标记），文字在模板里用 c() 输出
const amenityGroups = computed(() =>
  list(`${at.value}.amenities`)
    .map(index => {
      const path = `${at.value}.amenities.${index}`;
      const items = list(`${path}.items`)
        .map(i => {
          const leaf = raw<{ en?: string; zh?: string } | string>(`${path}.items.${i}`);
          return { path: `${path}.items.${i}`, icon: typeof leaf === "string" ? leaf : `${leaf?.en ?? ""} ${leaf?.zh ?? ""}`.trim() };
        })
        .filter(item => item.icon);
      return { path, items };
    })
    .filter(group => group.items.length)
);

// 其他楼盘
const allBuildings = await useBuildings();
const others = computed(() => allBuildings.value.filter(item => item.slug !== props.building.slug && item.region === props.building.region).slice(0, 4));

const regionName = computed(() => {
  const item = regions.value.find(entry => entry.slug === props.building.region);
  return item ? bi(item.name) : "";
});

// ---- 相册（逻辑与房源详情页相同） ----
const photos = computed(() => [cover(props.building), ...list(`${at.value}.gallery`).map(index => img(`${at.value}.gallery.${index}`))].filter(Boolean));
const shown = computed(() => photos.value.slice(0, 5));
const viewer = ref<number | null>(null);
// 手机相册：滑到第几张（按滚动位置换算）
const swipeIndex = ref(0);
function onSwipe(event: Event) {
  const el = event.currentTarget as HTMLElement;
  swipeIndex.value = Math.round(el.scrollLeft / (el.clientWidth || 1));
}
const openViewer = (index: number) => (viewer.value = index);
const closeViewer = () => (viewer.value = null);
function step(delta: number) {
  const count = photos.value.length;
  if (count > 1 && viewer.value !== null) viewer.value = (viewer.value + delta + count) % count;
}
function onKey(event: KeyboardEvent) {
  if (viewer.value === null) return;
  if (event.key === "Escape") closeViewer();
  else if (event.key === "ArrowLeft") step(-1);
  else if (event.key === "ArrowRight") step(1);
}
watch(viewer, (value) => {
  if (import.meta.client) document.body.style.overflow = value === null ? "" : "hidden";
});
// 吸顶导航高亮当前读到的分区：哪个分区的顶部最后越过屏幕上方三分之一处，就高亮哪个
const activeSection = ref("bd-overview");
function updateActive() {
  const line = window.innerHeight * 0.33;
  let current = "bd-overview";
  for (const id of ["bd-overview", "bd-amenities", "bd-more"]) {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= line) current = id;
  }
  activeSection.value = current;
}
onMounted(() => {
  window.addEventListener("keydown", onKey);
  window.addEventListener("scroll", updateActive, { passive: true });
  updateActive();
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("scroll", updateActive);
  document.body.style.overflow = "";
});

// 概览：四张要点卡片（起租价、位置、建成年份、合作方式），没填的不显示。楼盘名已经是页面标题，不再重复
const overview = computed(() =>
  [
    { key: "price", label: c("building.startingAt"), value: startingPrice.value ? `$${startingPrice.value.toLocaleString("en-US")}${c("detail.perMonth")}` : "" },
    { key: "location", label: c("building.facts.location"), value: text(props.building, "state") || regionName.value },
    { key: "year", label: c("building.facts.yearBuilt"), value: yearBuilt.value ? String(yearBuilt.value) : "" },
    { key: "partnership", label: c("building.facts.partnership"), value: tag.value }
  ].filter(row => row.value)
);

// 楼盘的价格、户型等目前还是占位资料，先不让搜索引擎收录
usePageSeo(() => ({ title: `${name.value} | ${site.c("brand.wordmark")}`, noindex: true }));
</script>
