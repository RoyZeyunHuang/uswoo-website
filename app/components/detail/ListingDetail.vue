<template>
  <div class="pg pg-listings pg-listing-detail">
    <SiteHeader active="listings" scrolled />

    <main id="top">
      <section class="ld-main">
        <div class="wrap">
          <NuxtLink class="ld-back" :to="backPath"><span aria-hidden="true">←</span> {{ backLabel }}</NuxtLink>

          <div class="ld-layout">
            <div class="ld-gallery">
              <div
                class="ld-stage"
                :tabindex="photos.length > 1 ? 0 : undefined"
                role="group"
                :aria-label="t('Photos', '房源照片')"
                @keydown.left.prevent="step(-1)"
                @keydown.right.prevent="step(1)"
              >
                <!-- 所有大图都在服务端输出（搜索引擎能看到），只显示当前一张；首张立即加载，其余切到时才加载 -->
                <img
                  v-for="(photo, index) in photos"
                  v-show="index === active"
                  :key="photo.url"
                  :src="photo.url"
                  :alt="bi(photo.alt) || `${title} ${index + 1}`"
                  :width="photo.width || undefined"
                  :height="photo.height || undefined"
                  :loading="index === 0 ? 'eager' : 'lazy'"
                  :fetchpriority="index === 0 ? 'high' : undefined"
                  decoding="async"
                />
                <span v-if="listing.tag" class="ls-tag">{{ tx(listing.tag) }}</span>
                <span v-if="leased" class="ld-leased">{{ t("Leased", "已租出") }}</span>
                <template v-if="photos.length > 1">
                  <button type="button" class="ld-arrow prev" :aria-label="t('Previous photo', '上一张')" @click="step(-1)">‹</button>
                  <button type="button" class="ld-arrow next" :aria-label="t('Next photo', '下一张')" @click="step(1)">›</button>
                  <span class="ld-count" aria-live="polite">{{ active + 1 }} / {{ photos.length }}</span>
                </template>
              </div>
              <div v-if="photos.length > 1" class="ld-thumbs">
                <button
                  v-for="(photo, index) in photos"
                  :key="photo.url"
                  type="button"
                  class="ld-thumb"
                  :class="{ on: index === active }"
                  :aria-label="t(`Show photo ${index + 1}`, `查看第 ${index + 1} 张照片`)"
                  :aria-current="index === active ? 'true' : undefined"
                  @click="active = index"
                >
                  <img :src="photo.url" alt="" loading="lazy" decoding="async" />
                </button>
              </div>
            </div>

            <div class="ld-info">
              <p class="eyebrow">
                <span class="idx">{{ regionName || tx("Exclusive Listings") }}</span>
                {{ listing.kind === "sale" ? t("For Sale", "出售") : t("For Rent", "出租") }}
              </p>
              <h1>{{ title }}</h1>
              <p v-if="location" class="ld-loc">{{ location }}</p>

              <div class="ld-price-row">
                <div v-if="listing.price !== null" class="ld-price">${{ listing.price.toLocaleString("en-US") }}<small v-if="listing.priceUnit === 'month'">{{ t("/mo", "/月") }}</small></div>
                <div v-else class="ld-price ask">{{ t("Price on request", "价格面议") }}</div>
              </div>

              <dl v-if="facts.length" class="ld-facts">
                <div v-for="fact in facts" :key="fact.label">
                  <dt>{{ fact.label }}</dt>
                  <dd>{{ fact.value }}</dd>
                </div>
              </dl>

              <div class="ld-cta">
                <NuxtLink class="btn btn-pink" :to="enquiryLink">
                  {{ leased ? t("Ask About Similar Homes", "咨询类似房源") : t("Enquire About This Home", "咨询这套房源") }}
                </NuxtLink>
                <p class="ld-cta-note">
                  {{
                    leased
                      ? t("This home has been leased. Tell us what you are looking for and we will find a similar one.", "这套房源已租出。告诉我们你的需求，我们为你匹配类似的房源。")
                      : t("Ask about availability or book a tour. We usually reply within one business day.", "了解空置情况或预约看房，我们通常会在一个工作日内回复。")
                  }}
                </p>
              </div>
            </div>
          </div>

          <div v-if="description" class="ld-desc">
            <h2>{{ t("About This Home", "房源介绍") }}</h2>
            <!-- 纯文字输出，换行靠样式保留 -->
            <p>{{ description }}</p>
          </div>

          <p class="ls-note">{{ tx("Listings are subject to prior sale, rental, or withdrawal. Contact us for availability and tours.") }}</p>
        </div>
      </section>
    </main>

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

/** 字典里没有的界面文案 */
const t = (en: string, zh: string) => (isZh.value ? zh : en);

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
const backLabel = computed(() => (region.value ? t(`Listings in ${regionName.value}`, `${regionName.value}房源`) : t("All Listings", "全部房源")));

const enquiryLink = computed(() => ({ path: localePath("/contact"), query: { listing: id.value, region: listing.value.region } }));

// ---- 图片：封面在前，后面是相册（去掉与封面重复的） ----

const photos = computed(() => {
  const all = [listing.value.cover, ...listing.value.images].filter((media): media is NonNullable<typeof media> => Boolean(media?.url));
  return all.filter((media, index) => all.findIndex(other => other.url === media.url) === index);
});
const active = ref(0);
function step(delta: number) {
  const count = photos.value.length;
  if (count > 1) active.value = (active.value + delta + count) % count;
}

// ---- 房源参数 ----

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** 接口给的是 YYYY-MM-DD，直接按字面拆开，不经过 Date（避免时区把日期挪一天） */
function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return isZh.value ? `${year}年${month}月${day}日` : `${MONTHS[month - 1] ?? ""} ${day}, ${year}`;
}

const facts = computed(() => {
  const { bedrooms, bathrooms, sqft, availableFrom, kind } = listing.value;
  const rows: { label: string; value: string }[] = [];
  if (bedrooms !== null) rows.push({ label: t("Bedrooms", "卧室"), value: bedrooms === 0 ? t("Studio", "开间") : String(bedrooms) });
  if (bathrooms !== null) rows.push({ label: t("Bathrooms", "卫生间"), value: String(bathrooms) });
  if (sqft !== null) rows.push({ label: t("Size", "面积"), value: t(`${sqft.toLocaleString("en-US")} sqft`, `${sqft.toLocaleString("en-US")} 平方英尺`) });
  if (availableFrom) rows.push({ label: t("Available From", "可入住日期"), value: formatDate(availableFrom) });
  rows.push({ label: t("Type", "类型"), value: kind === "sale" ? t("For Sale", "出售") : t("Rental", "出租") });
  return rows;
});

// ---- SEO ----

usePageSeo(() => {
  const item = listing.value;
  const url = absoluteUrl(localePath(`/listings/${item.id}`));
  const images = photos.value.map(photo => absoluteUrl(photo.url));
  const price = item.price !== null ? `$${item.price.toLocaleString("en-US")}${item.priceUnit === "month" ? t("/mo", "/月") : ""}` : "";
  const summary = [price, ...facts.value.slice(0, 3).map(fact => (fact.value === t("Studio", "开间") ? fact.value : `${fact.label} ${fact.value}`)), location.value]
    .filter(Boolean)
    .join(" · ");
  const flat = description.value.replace(/\s+/g, " ");
  const text = flat ? (flat.length > 160 ? `${flat.slice(0, 157).trimEnd()}…` : flat) : summary;

  const crumbs = [
    { name: t("Home", "首页"), path: "/" },
    { name: tx("Listings"), path: "/listings" },
    ...(region.value ? [{ name: regionName.value, path: listPath.value }] : []),
    { name: title.value, path: `/listings/${item.id}` }
  ];

  return {
    title: `${[title.value, neighborhood.value].filter(Boolean).join(" — ")} | USWOO`,
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
