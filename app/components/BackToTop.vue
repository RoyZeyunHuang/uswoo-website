<template>
  <button type="button" class="uswoo-btt" :class="{ show }" :aria-label="tx('Back to top')" :title="tx('Back to top')" @click="toTop">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  </button>
</template>

<script setup lang="ts">
const { tx } = useTx();
const show = ref(false);

function update() {
  show.value = (window.scrollY || document.documentElement.scrollTop || 0) > 400;
}

function toTop() {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
}

onMounted(() => {
  window.addEventListener("scroll", update, { passive: true });
  update();
});
onBeforeUnmount(() => window.removeEventListener("scroll", update));
</script>
