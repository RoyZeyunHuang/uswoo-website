/**
 * 独家楼盘（开发商 / 大楼）。
 * 注意：这是负责人（Monica）明确要求写在代码里的临时内容，违背「代码里不放内容」的规范。
 * 之后应迁到 CMS 的房源，再删掉这个文件和房源页里对应的区块。
 * 目前只有名称；照片、地址、价格等拿到资料后再补，没有的字段页面上不显示。
 */
export interface Building {
  slug: string;
  name: string;
  /** 所属地区，对应 useRegions() 里的 slug */
  region: string;
  tag: string;
  image?: string;
}

export const BUILDINGS_HEADING = { en: "Exclusive Buildings", zh: "独家楼盘" };

export const BUILDINGS: Building[] = [
  { slug: "43-cottage", name: "43 Cottage", region: "new-york", tag: "Exclusive" },
  { slug: "505-summit", name: "505 Summit", region: "new-york", tag: "Exclusive" }
];
