<template>
  <NuxtLink class="ls-card" :class="{ 'is-leased': leased }" :data-city="listing.region" :to="localePath(`/listings/${listing.id}`)">
    <div class="ls-media">
      <img :src="listing.cover?.url || ''" :alt="bi(listing.cover?.alt) || bi(listing.title)" loading="lazy" />
      <span v-if="listing.tag" class="ls-tag">{{ tx(listing.tag) }}</span>
      <span v-if="leased" class="ls-leased">{{ tx("Leased") }}</span>
    </div>
    <div class="ls-body">
      <div v-if="listing.price !== null" class="ls-price">
        ${{ listing.price.toLocaleString("en-US") }}<small v-if="listing.priceUnit === 'month'">{{ c("card.perMonth") }}</small>
      </div>
      <div class="ls-meta">{{ meta }}</div>
      <h3>{{ bi(listing.title) }}</h3>
      <p>{{ bi(listing.neighborhood) }}</p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import "~/assets/css/listing-card.extra.css";
import type { Listing } from "~~/shared/types/api";

/**
 * 房源卡片（首页精选与房源列表共用），点击进入房源详情页。
 * region：卡片所在页面的地区（不是房源自己的地区），传了就用该地区的卡片文案，不传用全站默认。
 */
const props = defineProps<{ listing: Listing; region?: string }>();
const { tx, bi } = useTx();
const localePath = useLocalePath();
const { c } = await usePageContent("listings", props.region);

const leased = computed(() => props.listing.status === "leased");

// 户型一行的写法来自 CMS（原站在中文页也保持英文写法）
const meta = computed(() => {
  const { bedrooms, bathrooms, sqft } = props.listing;
  const parts: string[] = [];
  if (bedrooms !== null) parts.push(bedrooms === 0 ? c("card.studio") : c("card.bed").replace("{n}", String(bedrooms)));
  if (bathrooms !== null) parts.push(c("card.bath").replace("{n}", String(bathrooms)));
  if (sqft !== null) parts.push(c("card.sqft").replace("{n}", String(sqft)));
  return parts.join(" · ");
});
</script>
