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
 * 页面内容，全部来自 CMS「新官网页面」，代码里不保留任何默认文案或图片。
 *
 *   const { c, ch, img, raw, list } = await usePageContent("home");
 *   c("hero.sub")                       // 纯文字，按当前语言取；缺了回退另一种语言
 *   ch("hero.title")                    // 给 v-html 用，只保留白名单里的少量内联标记
 *   img("hero.poster")                  // 图片地址
 *   raw<number>("about.stats.0.value")  // 数字、链接等原始值
 *   list("help.cards")                  // 列表的下标，配合 v-for 使用
 *   on("help")                          // 区块是否展示（help.show 不为 false）
 *
 * 字段在 CMS 里没有填时返回空字符串（列表为空数组），页面上对应位置留空。
 * 首页、Services、About、Partners 可以按地区配置：传入地区后，接口把该地区的内容盖在全站默认之上返回；
 * 该地区没有单独内容时就是全站默认（page.resolvedFrom = "global"）。
 */
export async function usePageContent(pageKey: string, region?: string) {
  const api = useApi();
  const { isZh } = useTx();
  // CMS 的页面编辑器内嵌预览时，用编辑器送来的（尚未保存的）内容代替已发布内容，见 useCmsEdit。
  // 必须在下面的 await 之前取：之后就拿不到 Nuxt 的上下文了
  const edit = useCmsEdit();
  const { data, error } = await useAsyncData(`page:${pageKey}:${region ?? ""}`, () => api<PageContent>(`/pages/${pageKey}`, { query: region ? { region } : {} }));
  // 内容取不到（接口故障，或这个页面还没在 CMS 里发布）时不渲染空壳页面
  if (error.value || !data.value) throw createError({ statusCode: 503, statusMessage: "Content unavailable", fatal: true });
  const payload = computed<Record<string, unknown>>(() => (edit.active.value && edit.overrides.value[pageKey]) || data.value?.payload || {});
  const ref = (path: string) => `${pageKey}:${path}`;

  /** 纯文字 */
  function c(path: string): string {
    const leaf = dig(payload.value, path) as Leaf | undefined;
    const text = typeof leaf === "string" ? leaf : !leaf || typeof leaf !== "object" ? "" : (isZh.value ? leaf.zh || leaf.en : leaf.en || leaf.zh) || "";
    // 编辑预览时在文字末尾带上看不见的标记，点页面上的文字就能定位到这个字段
    return text && edit.active.value ? text + cmsMark(ref(path)) : text;
  }
  /** 给 v-html 用：已转义，只保留白名单里的内联标记 */
  const ch = (path: string) => richHtml(c(path));
  /** 图片地址：CMS 里用媒体库图片（{"mediaId": n}）或直接写地址（{"url": "…"}） */
  function img(path: string): string {
    const leaf = dig(payload.value, path) as { url?: string | null } | undefined;
    const url = leaf?.url || "";
    return url && edit.active.value ? url + cmsImageMark(ref(path)) : url;
  }
  /** 数字、链接等原始值；没有填时是 undefined */
  function raw<T>(path: string): T | undefined {
    const leaf = dig(payload.value, path);
    return leaf === undefined || leaf === null || leaf === "" ? undefined : (leaf as T);
  }
  /** 列表字段的下标：`v-for="i in list('help.cards')"`，再用 c(`help.cards.${i}.title`) 取每一项的内容 */
  function list(path: string): number[] {
    const leaf = dig(payload.value, path);
    return Array.isArray(leaf) ? leaf.map((_, index) => index) : [];
  }

  /**
   * 区块是否展示：CMS 里把某个区块的 show 设为 false 就隐藏它（`<section v-if="on('help')">`）。
   * 没写 show 视为展示。地区可以只写 {"help": {"show": false}} 来隐藏全站默认里的某个区块。
   */
  const on = (path: string) => raw<boolean>(`${path}.show`) !== false;

  return { c, ch, img, raw, list, on, page: data as Ref<PageContent> };
}
