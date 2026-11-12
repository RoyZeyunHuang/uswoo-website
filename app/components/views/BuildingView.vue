<template>
  <div class="pg pg-listings pg-listing-detail pg-building">
    <SiteHeader active="listings" scrolled />

    <main id="top">
      <section class="ld-main">
        <div class="wrap">
          <NuxtLink class="ld-back" :to="localePath(regionPath('listings', building.region))"><span aria-hidden="true">←</span> {{ c("building.back") }}</NuxtLink>

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
                <span class="bd-addr">{{ c(`${at}.address`) || regionName }}</span>
                <span v-for="i in list(`${at}.summary`)" :key="i">{{ c(`${at}.summary.${i}`) }}</span>
              </div>
            </div>
            <div class="ld-cta">
              <NuxtLink class="btn btn-pink" :to="{ path: localePath(regionPath('contact', building.region)), query: { building: building.slug } }">{{ c("building.enquire") }}</NuxtLink>
            </div>
          </div>

          <div class="ld-overview">
            <h2>{{ c("detail.overview") }}</h2>
            <dl>
              <div v-for="row in overview" :key="row.label">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </div>
            </dl>
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
const name = computed(() => c(`${at.value}.name`));
const tag = computed(() => c(`${at.value}.tag`));
const startingPrice = computed(() => Number(raw(`${at.value}.startingPrice`)) || 0);
const yearBuilt = computed(() => Number(raw(`${at.value}.yearBuilt`)) || 0);
const localePath = useLocalePath();
const regions = await useRegions();
const site = await useSite();

const regionName = computed(() => {
  const item = regions.value.find(entry => entry.slug === props.building.region);
  return item ? bi(item.name) : "";
});

// ---- 相册（逻辑与房源详情页相同） ----
const photos = computed(() => [img(`${at.value}.image`), ...list(`${at.value}.gallery`).map(index => img(`${at.value}.gallery.${index}`))].filter(Boolean));
const shown = computed(() => photos.value.slice(0, 5));
const viewer = ref<number | null>(null);
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
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  document.body.style.overflow = "";
});

// 概览表：没填的项目不显示
const overview = computed(() =>
  [
    { label: c("building.facts.building"), value: name.value },
    { label: c("building.facts.location"), value: c(`${at.value}.state`) || regionName.value },
    { label: c("building.facts.yearBuilt"), value: yearBuilt.value ? String(yearBuilt.value) : "" },
    { label: c("building.facts.partnership"), value: tag.value }
  ].filter(row => row.value)
);

// 楼盘的价格、户型等目前还是占位资料，先不让搜索引擎收录
usePageSeo(() => ({ title: `${raw<string>(`${at.value}.name`) ?? ""} | ${site.c("brand.wordmark")}`, noindex: true }));
</script>
