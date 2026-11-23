/**
 * 独家楼盘：内容在 CMS「房源页」（listings）的 buildings.items 列表里，每一项是一栋楼。
 * 这里只给出每栋楼在列表里的位置和几个用来判断的原始值（网址、地区、图片裁切位置）；
 * 页面上的文字和图片用返回的 path 去取：c(`${path}.name`)、img(`${path}.image`)，这样 CMS 的实时预览才能定位到字段。
 */
export interface BuildingRef {
  /** 在内容里的路径，如 buildings.items.2 */
  path: string;
  slug: string;
  /** 所属地区，对应 useRegions() 里的 slug */
  region: string;
  /** 卡片封面的裁切位置（object-position），没填就居中 */
  position: string;
  /** 只在所属地区的页面上展示，不进「全部」房源页和全站首页（CMS 里的 regionOnly） */
  regionOnly: boolean;
}

export async function useBuildings(region?: string) {
  const { raw, list } = await usePageContent("listings", region);
  return computed<BuildingRef[]>(() =>
    list("buildings.items")
      .map(index => {
        const path = `buildings.items.${index}`;
        return {
          path,
          slug: String(raw<string>(`${path}.slug`) ?? "").trim(),
          region: String(raw<string>(`${path}.region`) ?? "").trim(),
          position: String(raw<string>(`${path}.imagePosition`) ?? "").trim(),
          regionOnly: raw<boolean>(`${path}.regionOnly`) === true
        };
      })
      // slug 重复时只认第一条：网址要唯一
      .filter((item, index, all) => item.slug && all.findIndex(other => other.slug === item.slug) === index)
  );
}

/** 某个页面该展示哪些楼盘：地区页只展示本地区的；不带地区的页面不展示标了「只在所属地区展示」的 */
export const buildingsFor = (all: BuildingRef[], region?: string) => all.filter(item => (region ? item.region === region : !item.regionOnly));

/**
 * 楼盘卡片与筛选要用到的值。文字和图片仍然经过 c() / img()，数字和用来判断的英文原文用 raw()。
 */
export async function useBuildingFields() {
  // 两个都要用到 Nuxt 上下文，同时发起，不能一个 await 完再调下一个
  const [{ c, img, raw, list }, regions] = await Promise.all([usePageContent("listings"), useRegions()]);
  const text = (item: BuildingRef, key: "name" | "state" | "address" | "tag") => c(`${item.path}.${key}`);
  /** 封面：楼盘没有自己的封面时用所在城市的封面图 */
  const cover = (item: BuildingRef) => img(`${item.path}.image`) || (regions.value.find(entry => entry.slug === item.region)?.cover?.url ?? "");
  const number = (item: BuildingRef, key: string) => Number(raw(`${item.path}.${key}`)) || 0;
  // 起租价、最多几间卧室、最多几个卫生间：给房源页的价格、户型筛选用
  const price = (item: BuildingRef) => number(item, "startingPrice");
  const maxBeds = (item: BuildingRef) => number(item, "maxBeds");
  const maxBaths = (item: BuildingRef) => number(item, "maxBaths");
  /** 设施筛选用：这栋楼各项设施的英文名（筛选按英文关键词匹配，与当前语言无关） */
  const amenityNames = (item: BuildingRef) =>
    list(`${item.path}.amenities`).flatMap(group =>
      list(`${item.path}.amenities.${group}.items`).map(index => {
        const leaf = raw<{ en?: string; zh?: string } | string>(`${item.path}.amenities.${group}.items.${index}`);
        return typeof leaf === "string" ? leaf : (leaf?.en || leaf?.zh || "");
      })
    );
  return { text, cover, price, maxBeds, maxBaths, amenityNames };
}
