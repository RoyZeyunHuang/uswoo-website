<template>
  <ViewsBuildingView :building="building" />
</template>

<script setup lang="ts">
import { BUILDINGS } from "~/data/buildings";

/** 楼盘页：/listings/building/<slug>。楼盘信息见 app/data/buildings.ts，版式在 views/BuildingView.vue。 */
const route = useRoute();
const building = BUILDINGS.find(item => item.slug === String(route.params.slug));
if (!building) throw createError({ statusCode: 404, statusMessage: "Page Not Found", fatal: true });
</script>
