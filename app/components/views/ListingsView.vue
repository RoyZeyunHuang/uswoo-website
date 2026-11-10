<template>
  <div class="pg pg-listings">
    <SiteHeader active="listings" scrolled />

    <main id="top">
      <section class="ls-hero">
        <div class="wrap">
          <p class="eyebrow"><span class="idx">01</span> {{ c("hero.eyebrow") }}</p>
          <h1>
            {{ c("hero.titleLead") }}<template v-if="!isZh">{{ " " }}</template
            ><span class="pink">{{ c("hero.titleAccent") }}</span>
          </h1>
          <p class="lede">{{ c("hero.lede") }}</p>
          <nav id="lsFilters" class="ls-filters" :aria-label="tx('Filter by city')">
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
          <div v-if="listings.length" id="lsGrid" class="ls-grid">
            <ListingCard v-for="listing in listings" :key="listing.id" :listing="listing" />
          </div>
          <!-- 原样式表里这一段默认隐藏、由脚本显示；这里按数据决定是否输出 -->
          <p v-else id="lsEmpty" class="ls-empty" style="display: block">{{ c("empty") }}</p>
          <div v-if="hasMore" class="ls-more">
            <button type="button" class="btn btn-outline on-paper" :disabled="loadingMore" @click="loadMore">
              {{ loadingMore ? tx("Loading…") : tx("Load more") }}
            </button>
          </div>
          <p class="ls-note">{{ c("disclaimer") }}</p>
        </div>
      </section>

      <section class="band-raised cta-band">
        <div class="wrap">
          <p class="eyebrow"><span class="idx">02</span> {{ c("cta.eyebrow") }}</p>
          <h2>{{ c("cta.title") }}</h2>
          <p class="lede">
            {{ c("cta.lede") }}
          </p>
          <div class="btn-row">
            <NuxtLink class="btn btn-pink" :to="localePath('/contact')">{{ c("cta.button") }}</NuxtLink>
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
import type { Listing, Paged } from "~~/shared/types/api";

/** 房源列表：/listings（全部地区）与 /{region}/listings（单个地区）共用。 */
const props = defineProps<{ region?: string }>();

const { region, regions } = await useRegion(props.region);
const { tx, bi, isZh } = useTx();
const localePath = useLocalePath();
const api = useApi();
const absoluteUrl = useAbsoluteUrl();
const { c } = await usePageContent("listings");

const PAGE_SIZE = 60;
const fetchPage = (page: number) => api<Paged<Listing>>("/listings", { query: { region: props.region, pageSize: PAGE_SIZE, page } });

const empty: Paged<Listing> = { list: [], total: 0, page: 1, pageSize: PAGE_SIZE };
const { data: firstPage } = await useAsyncData(`listings:${props.region ?? ""}`, () => fetchPage(1).catch(() => empty));

// 第一页随服务端渲染输出；后面的页由「加载更多」在浏览器里追加
const more = ref<Listing[]>([]);
const page = ref(1);
const loadingMore = ref(false);
const listings = computed(() => [...(firstPage.value?.list ?? []), ...more.value]);
const hasMore = computed(() => (firstPage.value?.total ?? 0) > listings.value.length);

async function loadMore() {
  if (loadingMore.value) return;
  loadingMore.value = true;
  try {
    const next = await fetchPage(page.value + 1);
    page.value += 1;
    // 翻页期间有新房源发布时，同一条可能出现在两页里
    const seen = new Set(listings.value.map(listing => listing.id));
    more.value.push(...next.list.filter(listing => !seen.has(listing.id)));
    // 接口没再给出新内容就不再显示按钮，避免空转
    if (!next.list.length && firstPage.value) firstPage.value = { ...firstPage.value, total: listings.value.length };
  } catch {
    // 加载失败：保留按钮，用户可以再点一次
  } finally {
    loadingMore.value = false;
  }
}

usePageSeo(() => {
  const name = region.value ? bi(region.value.name) : "";
  const path = regionPath("listings", region.value?.slug);
  const crumbs = [
    { "@type": "ListItem", position: 1, name: tx("Home"), item: absoluteUrl(localePath("/")) },
    { "@type": "ListItem", position: 2, name: c("name"), item: absoluteUrl(localePath("/listings")) }
  ];
  if (region.value) crumbs.push({ "@type": "ListItem", position: 3, name, item: absoluteUrl(localePath(path)) });

  const jsonLd: Record<string, unknown>[] = [{ "@type": "BreadcrumbList", itemListElement: crumbs }];
  if (region.value && listings.value.length) {
    jsonLd.push({
      "@type": "ItemList",
      name: c("seo.regionListName").replace("{region}", name),
      itemListElement: listings.value.map((listing, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: bi(listing.title),
        url: absoluteUrl(localePath(`/listings/${listing.id}`))
      }))
    });
  }

  return {
    title: region.value ? c("seo.regionTitle").replace("{region}", name) : c("seo.title"),
    description: region.value ? c("seo.regionDescription").replace("{region}", name) : c("seo.description"),
    // 还没有房源的地区页只有一句占位说明，不让搜索引擎收录
    noindex: Boolean(region.value) && !listings.value.length,
    jsonLd
  };
});
</script>
