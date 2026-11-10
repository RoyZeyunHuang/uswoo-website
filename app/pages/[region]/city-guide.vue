<template>
  <CityGuideView :region="String(route.params.region)" />
</template>

<script setup lang="ts">
import CityGuideView from "~/components/views/CityGuideView.vue";

const route = useRoute();
</script>
