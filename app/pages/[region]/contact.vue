<template>
  <ViewsContactView :region="String(route.params.region)" />
</template>

<script setup lang="ts">
const route = useRoute();
</script>
