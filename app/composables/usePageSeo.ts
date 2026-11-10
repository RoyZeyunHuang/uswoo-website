import type { PageContent } from "~~/shared/types/api";

interface PageSeo {
  /** 页面标题（不含站名时自己拼好再传） */
  title: string;
  description?: string;
  /** 关键词，逗号分隔；留空则不输出 */
  keywords?: string;
  /** 分享图，绝对地址或站内路径 */
  image?: string | null;
  /** 不希望被收录的页面：占位内容、示例房源、中文缺失的中文页等 */
  noindex?: boolean;
  /** canonical 指向别的页面时传不含语言前缀的路径（例如回退到全站默认的地区页指向汇总页） */
  canonicalPath?: string;
  ogType?: "website" | "article";
  /** schema.org 结构化数据，一项一个 <script type="application/ld+json"> */
  jsonLd?: Record<string, unknown>[];
}

/** 站内路径 → 正式域名下的绝对地址（canonical、结构化数据都以 uswoo.com 为准，测试站也一样） */
export function useAbsoluteUrl() {
  const config = useRuntimeConfig();
  const base = String(config.public.siteUrl).replace(/\/$/, "");
  return (path: string) => (/^https?:\/\//.test(path) ? path : base + (path.startsWith("/") ? path : `/${path}`));
}

/**
 * 标题、描述、关键词都由页面从 CMS「新官网页面」里自己那一页的 seo 字段取出后传进来（文章、房源用各自的 SEO 字段）。
 * 每个页面调用一次，输出 title、description、keywords、Open Graph、Twitter 卡片、canonical、robots 和结构化数据。
 * 入参可以是 getter，内容随语言或数据变化时自动更新。
 */
export function usePageSeo(input: PageSeo | (() => PageSeo)) {
  const seo = computed(() => (typeof input === "function" ? input() : input));
  const config = useRuntimeConfig();
  const route = useRoute();
  const localePath = useLocalePath();
  const absolute = useAbsoluteUrl();
  const production = config.public.deployEnv === "production";

  const { locale } = useI18n();
  const title = computed(() => seo.value.title);
  const description = computed(() => seo.value.description || undefined);

  // 站点名称与默认分享图来自 CMS「全站通用」（app.vue 已经取好）
  const site = useNuxtData<PageContent>("page:site:");
  const brand = computed(() => (site.data.value?.payload ?? {}) as { brand?: { siteName?: { en?: string; zh?: string } }; seo?: { defaultImage?: { url?: string | null } } });
  const siteName = computed(() => {
    const name = brand.value.brand?.siteName;
    return (locale.value === "zh" ? name?.zh || name?.en : name?.en || name?.zh) || undefined;
  });

  const canonical = computed(() => absolute(seo.value.canonicalPath ? localePath(seo.value.canonicalPath) : route.path));
  const image = computed(() => {
    const url = seo.value.image || brand.value.seo?.defaultImage?.url;
    return url ? absolute(url) : undefined;
  });

  useSeoMeta({
    title: () => title.value,
    description: () => description.value,
    ogTitle: () => title.value,
    ogDescription: () => description.value,
    ogType: () => seo.value.ogType ?? "website",
    ogUrl: () => canonical.value,
    ogImage: () => image.value,
    ogSiteName: () => siteName.value,
    twitterCard: "summary_large_image",
    twitterTitle: () => title.value,
    twitterDescription: () => description.value,
    twitterImage: () => image.value
  });

  useHead({
    link: () => [{ rel: "canonical", href: canonical.value, key: "canonical" }],
    // 测试站在 app.vue 里整站 noindex，这里只处理正式站上个别不收录的页面
    meta: () => [
      ...(production && seo.value.noindex ? [{ name: "robots", content: "noindex, follow", key: "robots" }] : []),
      ...(seo.value.keywords ? [{ name: "keywords", content: seo.value.keywords, key: "keywords" }] : [])
    ],
    script: () => (seo.value.jsonLd ?? []).map((item, index) => ({ type: "application/ld+json", key: `ld-${index}`, innerHTML: JSON.stringify({ "@context": "https://schema.org", ...item }) }))
  });
}
