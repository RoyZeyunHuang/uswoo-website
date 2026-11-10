<template>
  <DetailListingDetail :listing="listing" />
</template>

<script setup lang="ts">
import type { Listing } from "~~/shared/types/api";

/** 房源详情：取数在这里，版式在 components/detail/ListingDetail.vue（草稿预览页共用同一个版式）。 */
const route = useRoute();
const api = useApi();
const notFound = () => createError({ statusCode: 404, statusMessage: "Page Not Found", fatal: true });

const id = String(route.params.id);
if (!/^\d+$/.test(id)) throw notFound();

const { data, error } = await useAsyncData(`listing:${id}`, () => orNull(api<Listing>(`/listings/${id}`)));
if (error.value) throw createError({ statusCode: 502, statusMessage: "Listing unavailable", fatal: true });
if (!data.value) throw notFound();
const listing = computed(() => data.value as Listing);
</script>
