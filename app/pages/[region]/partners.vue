<template>
  <PartnersView :region="String(route.params.region)" />
</template>

<script setup lang="ts">
import PartnersView from "~/components/views/PartnersView.vue";

const route = useRoute();
</script>
