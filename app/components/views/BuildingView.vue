<template>
  <div class="pg pg-listings pg-listing-detail pg-building">
    <SiteHeader active="listings" scrolled />

    <main id="top">
      <section class="ld-main">
        <div class="wrap">
          <NuxtLink class="ld-back" :to="localePath(regionPath('listings', building.region))"><span aria-hidden="true">←</span> {{ tx("All buildings") }}</NuxtLink>

          <!-- 相册：一张大图加最多四张小图，点任意一张打开全屏查看（版式与房源详情页一致） -->
          <div v-if="photos.length" class="ld-mosaic" :class="{ single: photos.length === 1 }" :data-count="Math.min(photos.length, 5)" role="group" :aria-label="building.name">
            <button v-for="(photo, index) in shown" :key="photo" type="button" class="ld-tile" :class="{ main: index === 0 }" :aria-label="tx('Show photo {n}').replace('{n}', String(index + 1))" @click="openViewer(index)">
              <img :src="photo" :alt="`${building.name} ${index + 1}`" :loading="index === 0 ? 'eager' : 'lazy'" decoding="async" />
              <span v-if="index === 0" class="ls-tag">{{ tx(building.tag) }}</span>
              <span v-if="index === shown.length - 1 && photos.length > 1" class="ld-allphotos">{{ tx("View All Photos") }} <span aria-hidden="true">›</span></span>
            </button>
          </div>

          <div class="ld-head">
            <div class="ld-head-main">
              <p class="eyebrow">{{ tx(building.tag) }}</p>
              <!-- 名称和起租价同一行，地址与户型合并成一行小字 -->
              <div class="bd-titlerow">
                <h1>{{ building.name }}</h1>
                <div v-if="building.startingPrice" class="ld-price">
                  <small class="bd-from">{{ tx("Starting at") }}</small> ${{ building.startingPrice.toLocaleString("en-US") }}<small>{{ tx("/mo") }}</small>
                </div>
              </div>
              <div class="ld-summary bd-meta">
                <span>{{ building.address || regionName }}</span>
                <span v-for="part in building.summary" :key="part">{{ part }}</span>
              </div>
            </div>
            <div class="ld-cta">
              <NuxtLink class="btn btn-pink" :to="{ path: localePath(regionPath('contact', building.region)), query: { building: building.slug } }">{{ tx("Enquire") }}</NuxtLink>
            </div>
          </div>

          <div class="ld-overview">
            <h2>{{ tx("Overview") }}</h2>
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
    <div v-if="viewer !== null" class="ld-viewer" role="dialog" aria-modal="true" :aria-label="building.name" @click.self="closeViewer">
      <button type="button" class="ld-viewer-close" :aria-label="tx('Close')" @click="closeViewer">×</button>
      <button v-if="photos.length > 1" type="button" class="ld-arrow prev" :aria-label="tx('Previous photo')" @click="step(-1)">‹</button>
      <img :src="photos[viewer]" :alt="building.name" />
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
import type { Building } from "~/data/buildings";

/** 楼盘页：介绍这栋楼，版式与房源详情页一致（相册、标题、概览表）。 */
const props = defineProps<{ building: Building }>();
const { tx, bi, isZh } = useTx();
const localePath = useLocalePath();
const regions = await useRegions();
const site = await useSite();

const regionName = computed(() => {
  const item = regions.value.find(entry => entry.slug === props.building.region);
  return item ? bi(item.name) : "";
});

// ---- 相册（逻辑与房源详情页相同） ----
const photos = computed(() => [props.building.image, ...(props.building.gallery ?? [])].filter((url): url is string => Boolean(url)));
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

// 概览表：目前只放确定的信息，开发商、年份、户数等拿到资料后再补
const overview = computed(() => [
  { label: tx("Building"), value: props.building.name },
  { label: tx("Location"), value: props.building.state ? (isZh.value ? props.building.state.zh : props.building.state.en) : regionName.value },
  ...(props.building.yearBuilt ? [{ label: tx("Year built"), value: String(props.building.yearBuilt) }] : []),
  { label: tx("Partnership"), value: tx(props.building.tag) }
]);

// 楼盘内容是临时写在代码里的，先不让搜索引擎收录
usePageSeo(() => ({ title: `${props.building.name} | ${site.c("brand.wordmark")}`, noindex: true }));
</script>
