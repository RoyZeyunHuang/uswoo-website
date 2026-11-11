<template>
  <ViewsHomeView :region="String(route.params.region)" />
</template>

<script setup lang="ts">
/** 地区首页：/{region}。地区不存在时由视图里的 useRegion 返回 404。 */
const route = useRoute();
</script>
