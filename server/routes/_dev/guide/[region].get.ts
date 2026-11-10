import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Guide, GuidePlace, Media } from "~~/shared/types/api";

interface SeedPlace extends Omit<GuidePlace, "id" | "logo" | "images"> {
  logo: string | null;
  images: string[];
  sort: number;
}
interface SeedGuide {
  region: string;
  payload: Record<string, unknown>;
  places: SeedPlace[];
}

const media = (url: string): Media => ({ id: 0, url, width: 0, height: 0, alt: { en: "", zh: "" } });

/**
 * 【仅本地开发用】CMS 里还没有导入 City Guide 时，把 seed/guides/<region>.json 转成接口的返回格式，
 * 让页面在导入之前就能核对。正式环境与测试站一律 404；页面只在 import.meta.dev 且接口 404 时才会请求这里。
 */
export default defineEventHandler(async (event): Promise<Guide> => {
  if (!import.meta.dev) throw createError({ statusCode: 404 });
  const region = getRouterParam(event, "region") ?? "";
  if (!/^[a-z0-9-]+$/.test(region)) throw createError({ statusCode: 404 });
  // 波士顿没有自己的数据：与 CMS 里的做法一样，复制纽约的内容并标记为占位
  const placeholder = region === "boston";
  let seed: SeedGuide;
  try {
    seed = JSON.parse(await readFile(resolve(process.cwd(), "seed/guides", `${placeholder ? "new-york" : region}.json`), "utf8")) as SeedGuide;
  } catch {
    throw createError({ statusCode: 404 });
  }
  return {
    region,
    isPlaceholder: placeholder,
    payload: seed.payload,
    places: [...seed.places]
      .sort((a, b) => a.sort - b.sort)
      .map(({ sort: _sort, logo, images, ...place }, index) => ({ ...place, id: index + 1, logo: logo ? media(logo) : null, images: images.map(media) })),
    updatedAt: null
  };
});
