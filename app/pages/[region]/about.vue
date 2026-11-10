<template>
  <AboutView :region="String(route.params.region)" />
</template>

<script setup lang="ts">
import AboutView from "~/components/views/AboutView.vue";

const route = useRoute();
</script>
