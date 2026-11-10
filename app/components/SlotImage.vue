<template>
  <div class="image-slot" :style="{ width: '100%', height: '100%', borderRadius: radius ? `${radius}px` : undefined }">
    <img v-if="src" :src="src" :alt="alt" :loading="eager ? 'eager' : 'lazy'" decoding="async" />
  </div>
</template>

<script setup lang="ts">
/** 按容器裁切铺满的图片框，对应原站的 <image-slot>。 */
defineProps<{ src?: string | null; alt?: string; radius?: number; eager?: boolean }>();
</script>
