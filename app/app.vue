<template>
  <NuxtPage :page-key="pageKey" />
  <BackToTop />
</template>

<script setup lang="ts">
const { locale } = useI18n();
const head = useLocaleHead();
const config = useRuntimeConfig();

// CMS 可视化编辑预览时，区块显隐变化后让页面整体重新挂载（见 useCmsEdit）；平时就是按路由区分
const { epoch } = useCmsEdit();
const pageKey = (route: { fullPath: string }) => `${route.fullPath}#${epoch.value}`;

// 站点名称、favicon、默认分享图来自 CMS「新官网页面 → 全站通用」的全站默认版本（不随地区变化）；
// 这里先取好，usePageSeo 直接读这份数据。导航、页脚在地区页上另取该地区的版本
const { img: siteImage } = await useSite({ global: true });

useHead({
  // data-lang 供沿用自原站的样式使用（html[data-lang="zh"] …）
  htmlAttrs: { lang: () => head.value.htmlAttrs?.lang ?? "en", "data-lang": () => locale.value },
  // canonical 由各页面的 usePageSeo 输出（地区页回退到全站默认时要指向汇总页），这里只保留 hreflang
  link: () => [
    ...(head.value.link ?? []).filter(link => link.rel !== "canonical"),
    ...(siteImage("brand.favicon") ? [{ rel: "icon" as const, href: siteImage("brand.favicon"), key: "favicon" }] : [])
  ],
  meta: () => [
    ...(head.value.meta ?? []),
    // 测试站整站不被收录；正式站由各页面自己决定
    ...(config.public.deployEnv === "production" ? [] : [{ name: "robots", content: "noindex, nofollow" }])
  ]
});
</script>
