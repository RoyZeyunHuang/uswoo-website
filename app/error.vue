<template>
  <div class="pg error-page">
    <div class="error-box">
      <NuxtLink class="error-mark" :to="localePath('/')">USWOO</NuxtLink>
      <p class="error-code">{{ notFound ? "404" : (error?.statusCode ?? 500) }}</p>
      <h1>{{ notFound ? t("Page not found.", "页面不存在") : t("Something went wrong.", "页面出了点问题") }}</h1>
      <p class="error-text">
        {{ notFound ? t("The page you're looking for has moved or no longer exists.", "你访问的页面已被移动或不存在。") : t("Please try again in a moment.", "请稍后再试。") }}
      </p>
      <button type="button" class="error-cta" @click="home">{{ t("Back to Home", "返回首页") }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

/** 全站错误页（404 与渲染出错）。不依赖接口，保证任何情况下都能显示。 */
const props = defineProps<{ error: NuxtError | null }>();
const { locale } = useI18n();
const localePath = useLocalePath();
const notFound = computed(() => props.error?.statusCode === 404);
const t = (en: string, zh: string) => (locale.value === "zh" ? zh : en);
const home = () => clearError({ redirect: localePath("/") });

useHead({
  title: () => (notFound.value ? t("Page not found | USWOO", "页面不存在 | USWOO") : "USWOO"),
  htmlAttrs: { lang: () => (locale.value === "zh" ? "zh-CN" : "en-US"), "data-lang": () => locale.value },
  meta: [{ name: "robots", content: "noindex" }]
});
</script>

<style scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: #f6f5f3;
  color: #0f0f0f;
  font-family: Inter, system-ui, sans-serif;
  text-align: center;
}
.error-mark {
  font-family: Poppins, sans-serif;
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 0.04em;
  color: inherit;
  text-decoration: none;
}
.error-code {
  margin: 40px 0 0;
  font-family: Poppins, sans-serif;
  font-weight: 200;
  font-size: clamp(88px, 18vw, 160px);
  line-height: 1;
}
h1 {
  margin: 12px 0 0;
  font-family: Poppins, sans-serif;
  font-weight: 600;
  font-size: clamp(24px, 4vw, 34px);
}
.error-text {
  margin: 14px auto 0;
  max-width: 420px;
  color: #5b5955;
  font-size: 16px;
  line-height: 1.6;
}
.error-cta {
  margin-top: 32px;
  padding: 14px 28px;
  border: 0;
  border-radius: 999px;
  background: #0f0f0f;
  color: #fff;
  font: 600 15px Inter, system-ui, sans-serif;
  cursor: pointer;
}
</style>
