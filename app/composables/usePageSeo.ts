import type { SeoPages } from "~~/shared/types/api";

interface PageSeo {
  /** 页面标题（不含站名时自己拼好再传） */
  title: string;
  description?: string;
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

/** 路由名（去掉语言后缀）→ CMS「SEO 设置」里的页面键 */
const SEO_KEYS: Record<string, string> = {
  index: "home",
  services: "services",
  contact: "contact",
  about: "about",
  partners: "partners",
  press: "press",
  listings: "listings",
  "city-guides": "city-guides"
};

/** 站内路径 → 正式域名下的绝对地址（canonical、结构化数据都以 uswoo.com 为准，测试站也一样） */
export function useAbsoluteUrl() {
  const config = useRuntimeConfig();
  const base = String(config.public.siteUrl).replace(/\/$/, "");
  return (path: string) => (/^https?:\/\//.test(path) ? path : base + (path.startsWith("/") ? path : `/${path}`));
}

/**
 * 每个页面调用一次，输出 title、description、Open Graph、Twitter 卡片、canonical、robots 和结构化数据。
 * 入参可以是 getter，内容随语言或数据变化时自动更新。
 */
export function usePageSeo(input: PageSeo | (() => PageSeo)) {
  const seo = computed(() => (typeof input === "function" ? input() : input));
  const config = useRuntimeConfig();
  const route = useRoute();
  const localePath = useLocalePath();
  const absolute = useAbsoluteUrl();
  const production = config.public.deployEnv === "production";

  // CMS「SEO 设置」是沿用现有官网的那一份：每个页面一行、只有中文。
  // 所以只在中文页、且是全站一份的页面（首页、Services、Contact 和各汇总页）上用它覆盖标题与描述；
  // 英文页、地区页、文章和房源详情用页面自己的标题。
  const cmsSeo = useNuxtData<SeoPages>("seo");
  const { locale } = useI18n();
  const cms = computed(() => {
    if (locale.value !== "zh") return null;
    const key = SEO_KEYS[String(route.name ?? "").replace(/___[a-z]+$/, "")];
    return key ? (cmsSeo.data.value?.pages?.[key] ?? null) : null;
  });
  const title = computed(() => cms.value?.title || seo.value.title);
  const description = computed(() => cms.value?.description || seo.value.description || undefined);

  const canonical = computed(() => absolute(seo.value.canonicalPath ? localePath(seo.value.canonicalPath) : route.path));
  const image = computed(() => absolute(seo.value.image || "/assets/uswoo-hero-poster.jpg"));

  useSeoMeta({
    title: () => title.value,
    description: () => description.value,
    ogTitle: () => title.value,
    ogDescription: () => description.value,
    ogType: () => seo.value.ogType ?? "website",
    ogUrl: () => canonical.value,
    ogImage: () => image.value,
    ogSiteName: "USWOO",
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
      ...(cms.value?.keywords ? [{ name: "keywords", content: cms.value.keywords, key: "keywords" }] : [])
    ],
    script: () => (seo.value.jsonLd ?? []).map((item, index) => ({ type: "application/ld+json", key: `ld-${index}`, innerHTML: JSON.stringify({ "@context": "https://schema.org", ...item }) }))
  });
}
