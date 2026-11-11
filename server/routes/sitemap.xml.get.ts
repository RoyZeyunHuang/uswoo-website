interface SitemapData {
  regions: { slug: string; guide: { updatedAt: string | null } | null; pages: Record<string, string | null> }[];
  pages: Record<string, string | null>;
  posts: { slug: string; updatedAt: string | null; hasZh: boolean }[];
  listings: { id: number; updatedAt: string | null; hasZh: boolean }[];
}

interface Entry {
  path: string;
  lastmod?: string | null;
  /** 中文内容不齐的页面只列英文网址 */
  zh?: boolean;
}

const xml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * 站点地图：静态页、各地区的列表页与 City Guide、全部已发布的文章与房源，带中英文对应关系。
 * 哪些内容可收录由后端 /sitemap 接口决定（占位 City Guide、示例房源、外部报道等不在其中）；
 * 回退到全站默认内容的地区首页、Services、About、Partners、Contact 与全站页面内容相同，也不列入。
 */
export default defineEventHandler(async event => {
  const config = useRuntimeConfig(event);
  const site = String(config.public.siteUrl).replace(/\/$/, "");
  const data = await publicApi<SitemapData>(event, "/sitemap");

  const entries: Entry[] = [
    { path: "/", lastmod: data.pages.home },
    { path: "/services", lastmod: data.pages.services },
    { path: "/contact", lastmod: data.pages.contact },
    { path: "/about", lastmod: data.pages.about },
    { path: "/partners", lastmod: data.pages.partners },
    { path: "/press" },
    { path: "/listings" }
  ];
  for (const region of data.regions) {
    if (region.guide) entries.push({ path: `/${region.slug}/city-guide`, lastmod: region.guide.updatedAt });
    entries.push({ path: `/${region.slug}/listings` }, { path: `/${region.slug}/press` });
    // 只有单独配置过内容的地区页才列入（没配置的与全站页面内容相同，canonical 指向全站页面）
    if ("home" in region.pages) entries.push({ path: `/${region.slug}`, lastmod: region.pages.home });
    for (const key of ["services", "about", "partners", "contact"]) {
      if (key in region.pages) entries.push({ path: `/${region.slug}/${key}`, lastmod: region.pages[key] });
    }
  }
  for (const post of data.posts) entries.push({ path: `/press/${post.slug}`, lastmod: post.updatedAt, zh: post.hasZh });
  for (const listing of data.listings) entries.push({ path: `/listings/${listing.id}`, lastmod: listing.updatedAt, zh: listing.hasZh });

  const urls: string[] = [];
  for (const entry of entries) {
    const en = site + (entry.path === "/" ? "/" : entry.path);
    const zh = `${site}/zh${entry.path === "/" ? "" : entry.path}`;
    const hasZh = entry.zh !== false;
    const alternates =
      `<xhtml:link rel="alternate" hreflang="en" href="${xml(en)}"/>` +
      (hasZh ? `<xhtml:link rel="alternate" hreflang="zh" href="${xml(zh)}"/>` : "") +
      `<xhtml:link rel="alternate" hreflang="x-default" href="${xml(en)}"/>`;
    const lastmod = entry.lastmod ? `<lastmod>${xml(entry.lastmod.slice(0, 10))}</lastmod>` : "";
    urls.push(`<url><loc>${xml(en)}</loc>${lastmod}${alternates}</url>`);
    if (hasZh) urls.push(`<url><loc>${xml(zh)}</loc>${lastmod}${alternates}</url>`);
  }

  setHeader(event, "content-type", "application/xml; charset=utf-8");
  setHeader(event, "cache-control", "public, max-age=600");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
});
