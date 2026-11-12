<template>
  <ViewsBuildingView v-if="building" :building="building" />
</template>

<script setup lang="ts">
/** 楼盘页：/listings/building/<slug>。楼盘信息在 CMS「房源页」的 buildings.items 里，版式在 views/BuildingView.vue。 */
const route = useRoute();
const buildings = await useBuildings();
const building = computed(() => buildings.value.find(item => item.slug === String(route.params.slug)));
if (!building.value) throw createError({ statusCode: 404, statusMessage: "Page Not Found", fatal: true });
</script>
