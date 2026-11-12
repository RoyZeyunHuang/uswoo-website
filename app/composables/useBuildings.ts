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
          position: String(raw<string>(`${path}.imagePosition`) ?? "").trim()
        };
      })
      .filter(item => item.slug)
  );
}
