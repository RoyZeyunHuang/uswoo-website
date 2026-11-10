/**
 * 【仅本地开发用】返回页面渲染时记下的字段默认值（见 app/composables/usePageContent.ts 的 recordDefault），
 * 供 tools/seed-pages.mjs 生成 seed/pages/*.json。正式环境与测试站一律 404。
 */
export default defineEventHandler(() => {
  if (!import.meta.dev) throw createError({ statusCode: 404 });
  return (globalThis as { __uswooPageDefaults?: Record<string, Record<string, unknown>> }).__uswooPageDefaults ?? {};
});
