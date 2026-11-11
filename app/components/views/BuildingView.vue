<template>
  <div class="pg pg-listings pg-building">
    <SiteHeader active="listings" scrolled />

    <main id="top">
      <section class="ls-hero">
        <div class="wrap">
          <NuxtLink class="ld-back" :to="localePath(regionPath('listings', building.region))"><span aria-hidden="true">←</span> {{ tx("All buildings") }}</NuxtLink>
          <p class="eyebrow bd-eyebrow">
            <span class="idx">{{ regionName }}</span> {{ tx(building.tag) }}
          </p>
          <h1>{{ building.name }}</h1>
        </div>
      </section>

      <section class="ls-grid-sec">
        <div class="wrap">
          <div v-if="units.length" id="lsGrid" class="ls-grid">
            <ListingCard v-for="listing in units" :key="listing.id" :listing="listing" :region="building.region" />
          </div>
          <p v-else id="lsEmpty" class="ls-empty" style="display: block">{{ tx("Listings for this building are coming soon. Contact us to hear first.") }}</p>
          <div class="ls-more">
            <NuxtLink class="btn btn-pink" :to="{ path: localePath(regionPath('contact', building.region)), query: { building: building.slug } }">{{ tx("Enquire") }}</NuxtLink>
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
import type { Building } from "~/data/buildings";

/** 楼盘页：这栋楼下的各个房源。房源来自接口，标题、地址或街区里带有楼盘名的算这栋楼的。 */
const props = defineProps<{ building: Building }>();
const { tx, bi } = useTx();
const localePath = useLocalePath();
const api = useApi();
const regions = await useRegions();
const site = await useSite();

const regionName = computed(() => {
  const item = regions.value.find(entry => entry.slug === props.building.region);
  return item ? bi(item.name) : "";
});

const { data } = await useAsyncData(`building:${props.building.slug}`, () =>
  api<Paged<Listing>>("/listings", { query: { region: props.building.region, pageSize: 100 } }).catch(() => ({ list: [] as Listing[] }))
);
const matched = computed(() => {
  const terms = (props.building.match ?? [props.building.name]).map(term => term.toLowerCase());
  return (data.value?.list ?? []).filter((item) => {
    const text = [bi(item.title), item.address, bi(item.neighborhood)].join(" ").toLowerCase();
    return terms.some(term => text.includes(term));
  });
});
// 还没有真正属于这栋楼的房源时，先用 CMS 里的示例房源把卡片版式撑起来，等真实房源录入后会自动被替换
const units = computed(() => (matched.value.length ? matched.value : (data.value?.list ?? []).filter(item => item.isSample)));

// 楼盘内容是临时写在代码里的，先不让搜索引擎收录
usePageSeo(() => ({ title: `${props.building.name} | ${site.c("brand.wordmark")}`, noindex: true }));
</script>
