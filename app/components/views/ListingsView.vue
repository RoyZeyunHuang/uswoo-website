<template>
  <div class="pg pg-listings">
    <SiteHeader active="listings" scrolled />

    <main id="top">
      <!-- 城市筛选排在首屏这一段里面，但在 CMS 里是单独的区块（filters）：隐藏首屏文字时筛选仍然保留 -->
      <section v-if="on('hero') || on('filters')" class="ls-hero">
        <div class="wrap">
          <template v-if="on('hero')">
            <p class="eyebrow"><span class="idx">01</span> {{ c("hero.eyebrow") }}</p>
            <h1>
              {{ c("hero.titleLead") }}<template v-if="!isZh">{{ " " }}</template
              ><span class="pink">{{ c("hero.titleAccent") }}</span>
            </h1>
            <p class="lede">{{ c("hero.lede") }}</p>
          </template>
          <nav v-if="on('filters')" id="lsFilters" class="ls-filters" :aria-label="tx('Filter by city')">
            <NuxtLink class="ls-chip" :class="{ on: !region }" :to="localePath(regionPath('listings'))" :aria-current="!region ? 'page' : undefined">
              {{ c("filters.all") }}
            </NuxtLink>
            <NuxtLink
              v-for="item in regions"
              :key="item.slug"
              class="ls-chip"
              :class="{ on: item.slug === region?.slug }"
              :to="localePath(regionPath('listings', item.slug))"
              :aria-current="item.slug === region?.slug ? 'page' : undefined"
            >
              {{ bi(item.name) }}
            </NuxtLink>
          </nav>
        </div>
      </section>

      <section class="ls-grid-sec">
        <div class="wrap">
          <!-- 独家楼盘：只在「全部」和对应地区出现。内容是临时写在代码里的，见 app/data/buildings.ts -->
          <div v-if="buildings.length" class="ls-dev">
            <p class="eyebrow">{{ isZh ? BUILDINGS_HEADING.zh : BUILDINGS_HEADING.en }}</p>
            <div class="ls-dev-grid">
              <NuxtLink
                v-for="item in buildings"
                :key="item.slug"
                class="ls-dev-card"
                :to="localePath(`/listings/building/${item.slug}`)"
              >
                <div class="ls-dev-media">
                  <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy" />
                  <span v-else class="ls-dev-ph" aria-hidden="true">{{ item.name }}</span>
                  <span class="ls-tag">{{ tx(item.tag) }}</span>
                </div>
                <div class="ls-dev-body">
                  <div>
                    <h3>{{ item.name }}</h3>
                    <p>{{ regionLabel(item.region) }}</p>
                  </div>
                  <span class="ls-dev-cta">{{ tx("View listings") }} <span aria-hidden="true">→</span></span>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- 列表页只展示合作的大楼 / 开发商；具体房源在点进楼盘之后 -->
          <p v-if="!buildings.length" id="lsEmpty" class="ls-empty" style="display: block">{{ c("empty") }}</p>
          <p class="ls-note">{{ c("disclaimer") }}</p>
        </div>
      </section>

      <section v-if="on('cta')" class="band-raised cta-band">
        <div class="wrap">
          <p class="eyebrow"><span class="idx">02</span> {{ c("cta.eyebrow") }}</p>
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
import { BUILDINGS, BUILDINGS_HEADING } from "~/data/buildings";

/** 房源列表：/listings（全部地区）与 /{region}/listings（单个地区）共用。 */
const props = defineProps<{ region?: string }>();

const { region, regions } = await useRegion(props.region);
const { tx, bi, isZh } = useTx();
const localePath = useLocalePath();
const absoluteUrl = useAbsoluteUrl();
// 页面上的固定文案：地区页用该地区的版本（没有单独配置的部分沿用全站默认）
const { c, on } = await usePageContent("listings", props.region);

// 独家楼盘：「全部」页显示所有，地区页只显示该地区的
const buildings = computed(() => BUILDINGS.filter(item => !props.region || item.region === props.region));
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
