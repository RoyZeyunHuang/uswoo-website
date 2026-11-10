<template>
  <NuxtPage />
  <BackToTop />
</template>

<script setup lang="ts">
import type { SeoPages } from "~~/shared/types/api";

const { locale } = useI18n();
const head = useLocaleHead();
const config = useRuntimeConfig();

// CMS「SEO 设置」里各页面的标题、描述、关键词。在这里先取好，页面里的 usePageSeo 直接读（见该文件）。
const api = useApi();
await useAsyncData("seo", () => api<SeoPages>("/seo").catch(() => ({ pages: {} }) as SeoPages));

useHead({
  // data-lang 供沿用自原站的样式使用（html[data-lang="zh"] …）
  htmlAttrs: { lang: () => head.value.htmlAttrs?.lang ?? "en", "data-lang": () => locale.value },
  // canonical 由各页面的 usePageSeo 输出（地区页回退到全站默认时要指向汇总页），这里只保留 hreflang
  link: () => (head.value.link ?? []).filter(link => link.rel !== "canonical"),
  meta: () => [
    ...(head.value.meta ?? []),
    // 测试站整站不被收录；正式站由各页面自己决定
    ...(config.public.deployEnv === "production" ? [] : [{ name: "robots", content: "noindex, nofollow" }])
  ]
});
</script>
