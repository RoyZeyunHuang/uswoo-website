import dictionary from "~/generated/zh.json";

const dict = dictionary as Record<string, string>;
const MONTHS: Record<string, number> = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

function norm(text: string): string {
  return text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
}

/** 按英文原文查中文：整句、去掉开头的表情或箭头后的整句、日期与阅读时长这两种固定格式 */
export function lookupZh(english: string): string | null {
  const text = norm(english);
  if (dict[text]) return dict[text];
  const prefixed = /^([^\p{L}\p{N}]+)([\s\S]+)$/u.exec(text);
  if (prefixed && dict[prefixed[2]!]) return prefixed[1]! + dict[prefixed[2]!];
  const date = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{4})$/.exec(text);
  if (date) return `${date[3]}年${MONTHS[date[1]!]}月${date[2]}日`;
  const read = /^(\d+(?:\.\d+)?) min read$/.exec(text);
  if (read) return `${read[1]} 分钟阅读`;
  return null;
}

/**
 * 界面固定文案：模板里写英文原文，中文从字典取（字典来自原站的 i18n-zh.js）。
 * 没有译文的句子保持英文。CMS 管理的内容不走这里，见 usePageContent。
 */
export function useTx() {
  const { locale } = useI18n();
  const isZh = computed(() => locale.value === "zh");

  function tx(english: string): string {
    return isZh.value ? (lookupZh(english) ?? english) : english;
  }

  /** 双语内容按当前语言取；缺了回退另一种 */
  function bi(value: { en?: string; zh?: string } | null | undefined): string {
    if (!value) return "";
    return isZh.value ? value.zh || value.en || "" : value.en || value.zh || "";
  }

  return { tx, bi, isZh, locale };
}
