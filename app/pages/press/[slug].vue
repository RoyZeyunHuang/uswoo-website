<template>
  <DetailArticleDetail :post="post" />
</template>

<script setup lang="ts">
import type { PostDetail } from "~~/shared/types/api";

/** 文章详情：取数在这里，版式在 components/detail/ArticleDetail.vue（草稿预览页共用同一个版式）。 */
const route = useRoute();
const api = useApi();
const slug = String(route.params.slug);

const { data, error } = await useAsyncData(`post:${slug}`, () => orNull(api<PostDetail>(`/posts/${encodeURIComponent(slug)}`)));
if (error.value) throw createError({ statusCode: 503, statusMessage: "Service Unavailable", fatal: true });
// 外部媒体报道只有外链；Brand Moments 只是卡片。两者都没有站内详情页
if (!data.value || data.value.externalUrl || data.value.type === "moment") throw createError({ statusCode: 404, statusMessage: "Page Not Found", fatal: true });
const post = computed(() => data.value as PostDetail);
</script>
