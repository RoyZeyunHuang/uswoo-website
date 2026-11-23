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
  /** 示例楼盘（见 utils/demoBuildings.ts）：内容在代码里，不在 CMS */
  demo?: DemoBuilding;
}

export async function useBuildings(region?: string) {
  const { raw, list } = await usePageContent("listings", region);
  return computed<BuildingRef[]>(() => [
    ...list("buildings.items")
      .map(index => {
        const path = `buildings.items.${index}`;
        return {
          path,
          slug: String(raw<string>(`${path}.slug`) ?? "").trim(),
          region: String(raw<string>(`${path}.region`) ?? "").trim(),
          position: String(raw<string>(`${path}.imagePosition`) ?? "").trim()
        };
      })
      .filter(item => item.slug),
    // CMS 里还没有的城市，先用示例楼盘顶上（slug 与 CMS 里重复的以 CMS 为准）
    ...DEMO_BUILDINGS.map(demo => ({ path: `demo.${demo.slug}`, slug: demo.slug, region: demo.region, position: "", demo }))
  ].filter((item, index, all) => all.findIndex(other => other.slug === item.slug) === index));
}

/**
 * 楼盘卡片与楼盘页上要显示的文字和封面：CMS 楼盘走 c()/img()，示例楼盘取代码里的资料（封面用所在城市的封面图）。
 * key 取 name / state / address / tag。
 */
export async function useBuildingFields() {
  // useTx 要在第一个 await 之前调用（await 之后拿不到 Nuxt 上下文）
  const { isZh } = useTx();
  // 两个都要用到 Nuxt 上下文，同时发起，不能一个 await 完再调下一个
  const [{ c, img, raw }, regions] = await Promise.all([usePageContent("listings"), useRegions()]);
  const text = (item: BuildingRef, key: "name" | "state" | "address" | "tag") => {
    if (!item.demo) return c(`${item.path}.${key}`);
    const value = key === "state" || key === "address" ? item.demo.address : item.demo[key];
    return isZh.value ? value.zh : value.en;
  };
  // 起租价与最大卧室数（从「开间 – 3 居室」这类概要里取第一个数字；开间一定算）：给房源页的价格、户型筛选用
  const price = (item: BuildingRef) => item.demo?.startingPrice ?? (Number(raw(`${item.path}.startingPrice`)) || 0);
  const maxBeds = (item: BuildingRef) => {
    const summary = item.demo ? item.demo.summary.en : c(`${item.path}.summary.0`);
    return Number(/\d+/.exec(summary)?.[0] ?? 0);
  };
  const cover = (item: BuildingRef) => (item.demo ? (regions.value.find(entry => entry.slug === item.region)?.cover?.url ?? "") : img(`${item.path}.image`));
  // 最多几个卫生间：取「1 – 2 baths」里最大的数字；示例楼盘按 2 个算
  const maxBaths = (item: BuildingRef) => (item.demo ? 2 : Math.max(0, ...(c(`${item.path}.summary.1`).match(/\d+/g) ?? []).map(Number)));
  // 设施筛选用：这栋楼的英文设施名（目前来自 buildingFallback；CMS 以后有了 amenities 再接）
  const amenityNames = (item: BuildingRef) => (BUILDING_FALLBACK[item.slug]?.amenities ?? []).flatMap(group => group.items.en);
  return { text, cover, price, maxBeds, maxBaths, amenityNames };
}
