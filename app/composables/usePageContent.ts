import type { PageContent } from "~~/shared/types/api";

type Leaf = string | { en?: string; zh?: string };

function dig(source: unknown, path: string): unknown {
  let node = source;
  for (const key of path.split(".")) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return node;
}

/**
 * 页面内容：CMS 里配置了就用 CMS 的，没配置的字段用代码里的默认文案。
 *
 *   const { c, ch } = await usePageContent("home");
 *   c("hero.sub", "More than finding an apartment…")          // 纯文字
 *   ch("hero.title", "Find Your Place in the City.", "在美国的新篇章<br class=m-br>从安心安家开始")  // 允许少量内联标记
 *
 * 默认中文：第三个参数给了就用它，否则按英文原文查字典。
 * 这样页面在 CMS 还没录入内容时就能完整显示；CMS 里改了哪个字段，哪个字段就以 CMS 为准。
 */
export async function usePageContent(pageKey: string, region?: string) {
  const api = useApi();
  const { isZh } = useTx();
  // 页面内容还没在 CMS 里发布时接口返回 404：用一个空内容顶上（返回 null 的话浏览器端会重新请求一次）
  const empty: PageContent = { key: pageKey, region: region ?? null, resolvedFrom: "global", payload: {}, updatedAt: null };
  const { data } = await useAsyncData(`page:${pageKey}:${region ?? ""}`, () =>
    orNull(api<PageContent>(`/pages/${pageKey}`, { query: region ? { region } : {} }))
      .then(page => page ?? empty)
      .catch(() => empty)
  );
  const payload = computed<Record<string, unknown>>(() => data.value?.payload ?? {});

  function text(path: string, english: string, chinese?: string): string {
    const leaf = dig(payload.value, path) as Leaf | undefined;
    const custom = typeof leaf === "string" ? { en: leaf, zh: "" } : leaf && typeof leaf === "object" ? leaf : null;
    if (isZh.value) return custom?.zh || chinese || lookupZh(english) || custom?.en || english;
    return custom?.en || english;
  }

  /** 纯文字 */
  const c = (path: string, english: string, chinese?: string) => text(path, english, chinese);
  /** 给 v-html 用：已转义，只保留白名单里的内联标记 */
  const ch = (path: string, english: string, chinese?: string) => richHtml(text(path, english, chinese));
  /** 图片：CMS 里用 {"mediaId": n} 配置后接口会带出 url；没配置就用默认图 */
  function img(path: string, fallback: string): string {
    const leaf = dig(payload.value, path) as { url?: string | null } | undefined;
    return leaf?.url || fallback;
  }
  /** 数字等原始值 */
  function raw<T>(path: string, fallback: T): T {
    const leaf = dig(payload.value, path);
    return leaf === undefined || leaf === null || leaf === "" ? fallback : (leaf as T);
  }

  return { c, ch, img, raw, page: data };
}
