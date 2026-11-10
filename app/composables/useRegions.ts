import type { Region } from "~~/shared/types/api";

/** 带地区的页面类型 → 网址里的那一段。汇总页（不带地区）的路径在 AGGREGATE 里。 */
const REGIONAL = { "city-guide": "city-guide", listings: "listings", press: "press", partners: "partners", about: "about" } as const;
const AGGREGATE = { "city-guide": "/city-guides", listings: "/listings", press: "/press", partners: "/partners", about: "/about" } as const;
export type RegionalPage = keyof typeof REGIONAL;

/** 不含语言前缀的路径：给了地区就是 /{region}/xxx，没给就是汇总页 */
export function regionPath(page: RegionalPage, region?: string | null): string {
  return region ? `/${region}/${REGIONAL[page]}` : AGGREGATE[page];
}

/** 已上线的地区（全站共用一次请求） */
export async function useRegions() {
  const api = useApi();
  const { data } = await useAsyncData("regions", () => api<Region[]>("/regions").catch(() => [] as Region[]));
  return computed(() => data.value ?? []);
}

/**
 * 地区页用：校验网址里的地区，不存在就是真实的 404。
 * 不传 slug（汇总页）时 region 为 null。
 */
export async function useRegion(slug?: string | null) {
  const regions = await useRegions();
  const region = computed(() => (slug ? (regions.value.find(item => item.slug === slug) ?? null) : null));
  if (slug && !region.value) throw createError({ statusCode: 404, statusMessage: "Page Not Found", fatal: true });
  return { region, regions };
}
