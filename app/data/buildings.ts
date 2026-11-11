/**
 * 独家楼盘（开发商 / 大楼）。
 * 注意：这是负责人（Monica）明确要求写在代码里的临时内容，违背「代码里不放内容」的规范。
 * 之后应迁到 CMS 的房源，再删掉这个文件和房源页里对应的区块。
 * 价格、户型、面积、建成年份目前是占位数字（页面上标注见各字段注释），拿到真实资料后替换。
 */
export interface Building {
  slug: string;
  name: string;
  /** 所属地区，对应 useRegions() 里的 slug */
  region: string;
  tag: string;
  /** 卡片和概览表里显示的所在州，不写就用地区名 */
  state?: { en: string; zh: string };
  /** 卡片封面的裁切位置（object-position），默认居中 */
  imagePosition?: string;
  image?: string;
  /** 街道地址（没有就不显示，用地区名顶上） */
  address?: string;
  /** 建成年份。43 Cottage 的目前是占位年份，拿到真实年份后替换 */
  yearBuilt?: number;
  /** 起租价，美元 / 月。目前是占位数字，拿到真实价格后替换 */
  startingPrice?: number;
  /** 标题下面那一行（户型、卫浴、面积），目前是占位文字，拿到资料后替换 */
  summary?: string[];
  /** 楼盘页上展示的相册（封面图之外的照片） */
  gallery?: string[];
  /** 房源的标题、地址或街区里出现这些词，就算这栋楼的房源（默认用楼盘名） */
  match?: string[];
}

export const BUILDINGS_HEADING = { en: "Exclusive Buildings", zh: "独家楼盘" };

export const BUILDINGS: Building[] = [
  {
    slug: "43-cottage",
    state: { en: "New Jersey", zh: "新泽西" },
    name: "43 Cottage",
    region: "new-york",
    tag: "Exclusive",
    image: "/buildings/43-cottage/cover.avif",
    address: "43 Cottage, Jersey City",
    yearBuilt: 2024,
    startingPrice: 2850,
    summary: ["Studio – 2 beds", "1 – 2 baths", "480 – 1,200 sq.ft."],
    gallery: ["01", "02", "03", "04"].map(n => `/buildings/43-cottage/${n}.webp`)
  },
  {
    slug: "505-summit",
    state: { en: "New Jersey", zh: "新泽西" },
    name: "505 Summit",
    region: "new-york",
    tag: "Exclusive",
    image: "/buildings/505-summit/cover.jpg",
    address: "505 Summit Avenue, Jersey City, NJ 07306",
    yearBuilt: 2023,
    startingPrice: 2650,
    summary: ["Studio – 3 beds", "1 – 2 baths", "450 – 1,400 sq.ft."],
    gallery: ["01.webp", "02.webp", "03.webp", "04.webp", "05.webp", "06.webp", "07.jpg", "08.jpg"].map(file => `/buildings/505-summit/${file}`)
  },
  {
    slug: "forten-at-columbia",
    state: { en: "New York", zh: "纽约" },
    name: "Forten at Columbia",
    region: "new-york",
    tag: "Exclusive",
    image: "/buildings/forten-at-columbia/cover.webp",
    address: "410 West 126th Street, New York, NY",
    yearBuilt: 2025,
    startingPrice: 3900,
    summary: ["Studio – 3 beds", "1 – 2 baths", "420 – 1,300 sq.ft."],
    gallery: ["01.webp", "02.webp", "03.webp", "04.jpg", "05.jpg"].map(file => `/buildings/forten-at-columbia/${file}`)
  },
  {
    slug: "1440-amsterdam-ave",
    state: { en: "New York", zh: "纽约" },
    name: "1440 Amsterdam Ave",
    imagePosition: "70% center",
    region: "new-york",
    tag: "Exclusive",
    image: "/buildings/1440-amsterdam-ave/cover.jpg",
    address: "1440 Amsterdam Ave, New York, NY",
    yearBuilt: 2025,
    startingPrice: 4695,
    summary: ["Studio – 2 beds", "1 – 2 baths", "400 – 1,100 sq.ft."],
    gallery: ["01", "02", "03", "04", "05", "06", "07", "08", "09"].map(n => `/buildings/1440-amsterdam-ave/${n}.jpg`)
  }
];
