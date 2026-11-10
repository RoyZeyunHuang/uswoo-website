<template>
  <div>
    <div class="preview-bar">{{ tx("Draft preview — not published yet. This link expires in 30 minutes.") }}</div>
    <DetailArticleDetail v-if="preview.entity === 'post'" :post="preview.data" preview />
    <DetailListingDetail v-else :listing="preview.data" preview />
  </div>
</template>

<script setup lang="ts">
import type { Listing, PostDetail } from "~~/shared/types/api";

/**
 * 草稿预览：CMS 里点「预览」得到带签名、限时的链接，打开后看到的是还没发布的内容。
 * 令牌由后端校验；无效、过期或内容不存在一律 404。预览页不缓存、不收录。
 */
type Preview = { entity: "post"; data: PostDetail } | { entity: "listing"; data: Listing };

const route = useRoute();
const api = useApi();
const { tx } = useTx();
const entity = String(route.params.entity);
const id = String(route.params.id);
const token = String(route.query.token ?? "");
const notFound = () => createError({ statusCode: 404, statusMessage: "Page Not Found", fatal: true });
if (!["post", "listing"].includes(entity) || !/^\d+$/.test(id) || !token) throw notFound();

const { data } = await useAsyncData(`preview:${entity}:${id}`, () => orNull(api<Preview>(`/preview/${entity}/${id}`, { query: { token } })).catch(() => null));
if (!data.value) throw notFound();
const preview = computed(() => data.value as Preview);
</script>

<style scoped>
.preview-bar {
  position: sticky;
  top: 0;
  z-index: 2000;
  padding: 8px 16px;
  background: #0f0f0f;
  color: #fff;
  font: 500 13px/1.4 Inter, system-ui, sans-serif;
  text-align: center;
}
</style>
