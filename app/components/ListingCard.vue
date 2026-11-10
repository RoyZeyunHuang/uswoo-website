<template>
  <NuxtLink class="ls-card" :class="{ 'is-leased': leased }" :data-city="listing.region" :to="localePath(`/listings/${listing.id}`)">
    <div class="ls-media">
      <img :src="listing.cover?.url || ''" :alt="bi(listing.cover?.alt) || bi(listing.title)" loading="lazy" />
      <span v-if="listing.tag" class="ls-tag">{{ tx(listing.tag) }}</span>
      <span v-if="leased" class="ls-leased">{{ isZh ? "已租出" : "Leased" }}</span>
    </div>
    <div class="ls-body">
      <div v-if="listing.price !== null" class="ls-price">
        ${{ listing.price.toLocaleString("en-US") }}<small v-if="listing.priceUnit === 'month'">{{ tx("/mo") }}</small>
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

/** 房源卡片（首页精选与房源列表共用），点击进入房源详情页。 */
const props = defineProps<{ listing: Listing }>();
const { tx, bi, isZh } = useTx();
const localePath = useLocalePath();

const leased = computed(() => props.listing.status === "leased");

// 户型一行在中文页也保持英文写法，与原站一致
const meta = computed(() => {
  const { bedrooms, bathrooms, sqft } = props.listing;
  const parts: string[] = [];
  if (bedrooms !== null) parts.push(bedrooms === 0 ? "Studio" : `${bedrooms} Bed`);
  if (bathrooms !== null) parts.push(`${bathrooms} Bath`);
  if (sqft !== null) parts.push(`${sqft} sqft`);
  return parts.join(" · ");
});
</script>
