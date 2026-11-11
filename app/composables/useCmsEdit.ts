/**
 * 可视化编辑：CMS 的页面编辑器把官网放在内嵌窗口里实时预览，编辑中的内容经 postMessage 送进来（见 plugins/cms-edit.client.ts）。
 *
 * 为了让「点页面上的文字 → 编辑器定位到对应字段」成立，编辑状态下 c() / ch() 返回的文字末尾会带一段看不见的标记，
 * 图片地址带一个 #cms= 片段，标记里是「页面键:字段路径」。普通访客永远不会进入编辑状态，输出里没有这些标记。
 */

// 标记只用不占宽度、也不产生换行机会的字符：WJ 做定界，ZWNJ / ZWJ 表示 0 / 1
const EDGE = "⁠";
const ZERO = "‌";
const ONE = "‍";
const MARK = /⁠([‌‍]+)⁠/;

/** 标记里只放序号，序号 → 「页面键:字段路径」记在这里（只在浏览器端的编辑状态下使用） */
const refs: string[] = [];
const ids = new Map<string, number>();

/** 给文字用的隐形标记 */
export function cmsMark(ref: string): string {
  let id = ids.get(ref);
  if (id === undefined) {
    id = refs.push(ref) - 1;
    ids.set(ref, id);
  }
  return EDGE + id.toString(2).replace(/0/g, ZERO).replace(/1/g, ONE) + EDGE;
}

/** 从一段文字里读出标记对应的「页面键:字段路径」 */
export function cmsRefOfText(text: string | null | undefined): string | null {
  const match = text ? MARK.exec(text) : null;
  if (!match) return null;
  const id = Number.parseInt(match[1]!.replace(/‌/g, "0").replace(/‍/g, "1"), 2);
  return refs[id] ?? null;
}

/** 给图片地址用的标记（地址片段不会发给服务器，不影响图片加载） */
export const cmsImageMark = (ref: string) => `#cms=${encodeURIComponent(ref)}`;

/** 从图片地址（或含地址的 style）里读出标记 */
export function cmsRefOfUrl(url: string | null | undefined): string | null {
  const match = url ? /#cms=([^"')\s]+)/.exec(url) : null;
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]!);
  } catch {
    return null;
  }
}

export function useCmsEdit() {
  return {
    /** 是否处于编辑预览状态：只会在浏览器端、由 CMS 内嵌打开时变成 true */
    active: useState("cms-edit:active", () => false),
    /** 编辑器送来的内容：页面键 → 内容。有的话优先于接口返回的已发布内容 */
    overrides: useState<Record<string, Record<string, unknown>>>("cms-edit:overrides", () => ({})),
    /** 区块的显隐变了就加一，让页面整体重新挂载（各页面的滚动出现效果是挂载时绑定的） */
    epoch: useState("cms-edit:epoch", () => 0)
  };
}
