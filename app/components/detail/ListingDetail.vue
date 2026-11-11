<template>
  <div class="pg pg-listings pg-listing-detail">
    <SiteHeader active="listings" scrolled />

    <main id="top">
      <section class="ld-main">
        <div class="wrap">
          <NuxtLink class="ld-back" :to="backPath"><span aria-hidden="true">←</span> {{ backLabel }}</NuxtLink>

          <!-- 相册：一张大图加最多四张小图，点任意一张打开全屏查看 -->
          <div class="ld-mosaic" :class="{ single: photos.length === 1 }" :data-count="Math.min(photos.length, 5)" role="group" :aria-label="c('detail.photos')">
            <button v-for="(photo, index) in shown" :key="photo.url" type="button" class="ld-tile" :class="{ main: index === 0 }" :aria-label="tx('Show photo {n}').replace('{n}', String(index + 1))" @click="openViewer(index)">
              <img
                :src="photo.url"
                :alt="bi(photo.alt) || `${title} ${index + 1}`"
                :width="photo.width || undefined"
                :height="photo.height || undefined"
                :loading="index === 0 ? 'eager' : 'lazy'"
                :fetchpriority="index === 0 ? 'high' : undefined"
                decoding="async"
              />
              <span v-if="index === 0 && listing.tag" class="ls-tag">{{ tx(listing.tag) }}</span>
              <span v-if="index === 0 && leased" class="ld-leased">{{ tx("Leased") }}</span>
              <span v-if="index === shown.length - 1 && photos.length > 1" class="ld-allphotos">{{ tx("View All Photos") }} <span aria-hidden="true">›</span></span>
            </button>
          </div>

          <div class="ld-head">
            <div class="ld-head-main">
              <p class="eyebrow">
                <span class="idx">{{ regionName || c("hero.eyebrow") }}</span>
                {{ c(listing.kind === "sale" ? "detail.forSale" : "detail.forRent") }}
              </p>
              <h1>{{ title }}</h1>
              <p v-if="location" class="ld-loc">{{ location }}</p>
              <div v-if="listing.price !== null" class="ld-price">${{ listing.price.toLocaleString("en-US") }}<small v-if="listing.priceUnit === 'month'">{{ c("detail.perMonth") }}</small></div>
              <div v-else class="ld-price ask">{{ c("detail.priceOnRequest") }}</div>
              <div class="ld-summary">
                <span v-for="part in summary" :key="part">{{ part }}</span>
                <button type="button" class="ld-share" @click="share">
                  {{ shared ? tx("Link copied") : tx("Share") }}
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" /></svg>
                </button>
              </div>
            </div>
            <div class="ld-cta">
              <NuxtLink class="btn btn-pink" :to="enquiryLink">
                {{ c(leased ? "detail.cta.leased" : "detail.cta.enquire") }}
              </NuxtLink>
              <p class="ld-cta-note">
                {{ c(leased ? "detail.cta.leasedNote" : "detail.cta.enquireNote") }}
              </p>
            </div>
          </div>

          <div v-if="overview.length" class="ld-overview">
            <h2>{{ tx("Overview") }}</h2>
            <dl>
              <div v-for="row in overview" :key="row.label">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </div>
            </dl>
          </div>

          <div v-if="description" class="ld-desc">
            <h2>{{ c("detail.aboutTitle") }}</h2>
            <!-- 纯文字输出，换行靠样式保留 -->
            <p>{{ description }}</p>
          </div>

          <p class="ls-note">{{ c("disclaimer") }}</p>
        </div>
      </section>
    </main>

    <!-- 全屏查看：键盘 ← → 切换，Esc 关闭 -->
    <div v-if="viewer !== null" class="ld-viewer" role="dialog" aria-modal="true" :aria-label="c('detail.photos')" @click.self="closeViewer">
      <button type="button" class="ld-viewer-close" :aria-label="tx('Close')" @click="closeViewer">×</button>
      <button v-if="photos.length > 1" type="button" class="ld-arrow prev" :aria-label="tx('Previous photo')" @click="step(-1)">‹</button>
      <img :src="photos[viewer]?.url" :alt="bi(photos[viewer]?.alt) || title" />
      <button v-if="photos.length > 1" type="button" class="ld-arrow next" :aria-label="tx('Next photo')" @click="step(1)">›</button>
      <span class="ld-count" aria-live="polite">{{ viewer + 1 }} / {{ photos.length }}</span>
    </div>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import "~/assets/css/pages/listings.css";
import "~/assets/css/pages/listing-detail.css";
import type { Listing } from "~~/shared/types/api";

/** 房源详情。原站没有这个页面，版式沿用房源列表页的字体、颜色与圆角。 */
const { tx, bi, isZh } = useTx();
const localePath = useLocalePath();
const absoluteUrl = useAbsoluteUrl();
const regions = await useRegions();
const { c } = await usePageContent("listings");
const site = await useSite();

const props = defineProps<{ listing: Listing; /** 草稿预览：不收录 */ preview?: boolean }>();
const listing = computed(() => props.listing);
const id = computed(() => String(props.listing.id));
const leased = computed(() => listing.value.status === "leased");
const title = computed(() => bi(listing.value.title));
const neighborhood = computed(() => bi(listing.value.neighborhood));
const location = computed(() => [neighborhood.value, listing.value.address].filter(Boolean).join(" · "));
const description = computed(() => bi(listing.value.description).trim());

// 所属地区已下线时，返回链接退到全部房源
const region = computed(() => regions.value.find(item => item.slug === listing.value.region) ?? null);
const regionName = computed(() => (region.value ? bi(region.value.name) : ""));
const listPath = computed(() => regionPath("listings", region.value?.slug));
const backPath = computed(() => localePath(listPath.value));
const backLabel = computed(() => (region.value ? c("detail.backRegion").replace("{region}", regionName.value) : c("detail.backAll")));

const enquiryLink = computed(() => ({ path: localePath("/contact"), query: { listing: id.value, region: listing.value.region } }));

// ---- 图片：封面在前，后面是相册（去掉与封面重复的） ----

const photos = computed(() => {
  const all = [listing.value.cover, ...listing.value.images].filter((media): media is NonNullable<typeof media> => Boolean(media?.url));
  return all.filter((media, index) => all.findIndex(other => other.url === media.url) === index);
});
/** 页面上直接展示的前五张（一大四小），其余在全屏查看里 */
const shown = computed(() => photos.value.slice(0, 5));

// 全屏查看：null 表示关闭。开着的时候锁住页面滚动，并监听键盘。
const viewer = ref<number | null>(null);
function openViewer(index: number) {
  viewer.value = index;
}
function closeViewer() {
  viewer.value = null;
}
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

// 分享：手机上走系统分享面板，其余复制链接
const shared = ref(false);
async function share() {
  const url = window.location.href;
  try {
    if (navigator.share) await navigator.share({ title: title.value, url });
    else {
      await navigator.clipboard.writeText(url);
      shared.value = true;
      setTimeout(() => (shared.value = false), 2000);
    }
  } catch {
    // 用户取消分享，不处理
  }
}

// ---- 房源参数 ----

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** 接口给的是 YYYY-MM-DD，直接按字面拆开，不经过 Date（避免时区把日期挪一天） */
function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return tx("{month} {day}, {year}")
    .replace("{monthNumber}", String(month))
    .replace("{month}", MONTHS[month - 1] ?? "")
    .replace("{day}", String(day))
    .replace("{year}", String(year));
}

const facts = computed(() => {
  const { bedrooms, bathrooms, sqft, availableFrom, kind } = listing.value;
  const rows: { label: string; value: string }[] = [];
  if (bedrooms !== null) rows.push({ label: c("detail.facts.bedrooms"), value: bedrooms === 0 ? tx("Studio") : String(bedrooms) });
  if (bathrooms !== null) rows.push({ label: c("detail.facts.bathrooms"), value: String(bathrooms) });
  if (sqft !== null) rows.push({ label: c("detail.facts.size"), value: tx("{n} sqft").replace("{n}", sqft.toLocaleString("en-US")) });
  if (availableFrom) rows.push({ label: c("detail.facts.availableFrom"), value: formatDate(availableFrom) });
  rows.push({ label: c("detail.facts.type"), value: c(kind === "sale" ? "detail.forSale" : "detail.facts.rental") });
  return rows;
});

/** 标题下面那一行：卧室、卫生间、面积 */
const summary = computed(() => {
  const { bedrooms, bathrooms, sqft } = listing.value;
  const parts: string[] = [];
  if (bedrooms !== null) parts.push(bedrooms === 0 ? tx("Studio") : tx(bedrooms === 1 ? "{n} bed" : "{n} beds").replace("{n}", String(bedrooms)));
  if (bathrooms !== null) parts.push(tx(bathrooms === 1 ? "{n} bath" : "{n} baths").replace("{n}", String(bathrooms)));
  if (sqft !== null) parts.push(tx("{n} sqft").replace("{n}", sqft.toLocaleString("en-US")));
  return parts;
});

/** 概览表：类型、位置，再接上面的房源参数 */
const overview = computed(() => {
  const byLabel = (label: string) => facts.value.find(fact => fact.label === label);
  const rows = [byLabel(c("detail.facts.type")), location.value ? { label: tx("Location"), value: location.value } : undefined];
  const rest = facts.value.filter(fact => fact.label !== c("detail.facts.type"));
  return [...rows, ...rest].filter((row): row is { label: string; value: string } => Boolean(row));
});

// ---- SEO ----

usePageSeo(() => {
  const item = listing.value;
  const url = absoluteUrl(localePath(`/listings/${item.id}`));
  const images = photos.value.map(photo => absoluteUrl(photo.url));
  const price = item.price !== null ? `$${item.price.toLocaleString("en-US")}${item.priceUnit === "month" ? c("detail.perMonth") : ""}` : "";
  const summary = [price, ...facts.value.slice(0, 3).map(fact => (fact.value === tx("Studio") ? fact.value : `${fact.label} ${fact.value}`)), location.value]
    .filter(Boolean)
    .join(" · ");
  const flat = description.value.replace(/\s+/g, " ");
  const text = flat ? (flat.length > 160 ? `${flat.slice(0, 157).trimEnd()}…` : flat) : summary;

  const crumbs = [
    { name: tx("Home"), path: "/" },
    { name: c("name"), path: "/listings" },
    ...(region.value ? [{ name: regionName.value, path: listPath.value }] : []),
    { name: title.value, path: `/listings/${item.id}` }
  ];

  return {
    title: `${[title.value, neighborhood.value].filter(Boolean).join(" — ")} | ${site.c("brand.wordmark")}`,
    description: text,
    image: item.cover?.url,
    // 示例房源、以及没有中文标题的中文页不收录
    canonicalPath: `/listings/${item.id}`,
    noindex: props.preview || item.isSample || (isZh.value && !item.title.zh),
    jsonLd: [
      {
        "@type": "RealEstateListing",
        name: title.value,
        description: flat || summary,
        url,
        ...(images.length ? { image: images } : {}),
        ...(item.updatedAt ? { datePosted: item.updatedAt, dateModified: item.updatedAt } : {}),
        ...(item.price !== null
          ? {
              offers: {
                "@type": "Offer",
                price: item.price,
                priceCurrency: "USD",
                availability: leased.value ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
                url,
                ...(item.priceUnit === "month"
                  ? { priceSpecification: { "@type": "UnitPriceSpecification", price: item.price, priceCurrency: "USD", unitCode: "MON" } }
                  : {})
              }
            }
          : {}),
        // RealEstateListing 本身是网页类型，地址与户型挂在它描述的住处上
        mainEntity: {
          "@type": "Accommodation",
          name: title.value,
          address: {
            "@type": "PostalAddress",
            ...(item.address ? { streetAddress: item.address } : {}),
            ...(neighborhood.value ? { addressLocality: neighborhood.value } : {}),
            ...(regionName.value ? { addressRegion: regionName.value } : {}),
            addressCountry: "US"
          },
          ...(item.bedrooms !== null ? { numberOfBedrooms: item.bedrooms } : {}),
          ...(item.bathrooms !== null ? { numberOfBathroomsTotal: item.bathrooms } : {}),
          ...(item.sqft !== null ? { floorSize: { "@type": "QuantitativeValue", value: item.sqft, unitCode: "FTK" } } : {})
        }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: absoluteUrl(localePath(crumb.path)) }))
      }
    ]
  };
});
</script>
