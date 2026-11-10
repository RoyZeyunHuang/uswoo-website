/** 公开接口 /api/uswoo/public/* 的返回类型，与 docs/refactor-plan.md 第 5.2 节一一对应。 */

export interface Bi {
  en: string;
  zh: string;
}

export interface Media {
  id: number;
  url: string;
  width: number;
  height: number;
  alt: Bi;
}

export interface Paged<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Region {
  id: number;
  slug: string;
  name: Bi;
  shortCode: string;
  emoji: string;
  cover: Media | null;
}

export interface PageContent {
  key: string;
  region: string | null;
  /** region = 该地区单独配置的内容；global = 全站默认（地区页回退时 canonical 指向汇总页） */
  resolvedFrom: "region" | "global";
  payload: Record<string, unknown>;
  updatedAt: string | null;
}

export type PostType = "press" | "story" | "moment";

export interface PostSummary {
  id: number;
  type: PostType;
  slug: string;
  title: Bi;
  summary: Bi;
  cover: Media | null;
  sourceName: string;
  /** 非空表示外部媒体报道：只外链，没有站内详情页 */
  externalUrl: string | null;
  author: string;
  readMinutes: number | null;
  publishedAt: string | null;
  isFeatured: boolean;
  isNational: boolean;
  regions: string[];
}

export interface PostDetail extends PostSummary {
  body: Bi;
  seo: { title: Bi; description: Bi; image: Media | null };
  updatedAt: string | null;
  related: PostSummary[];
}

export interface Listing {
  id: number;
  region: string;
  kind: "rental" | "sale";
  title: Bi;
  neighborhood: Bi;
  address: string;
  price: number | null;
  priceUnit: "month" | "total";
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  availableFrom: string | null;
  description: Bi;
  cover: Media | null;
  images: Media[];
  tag: string;
  status: "published" | "leased";
  isFeatured: boolean;
  /** 示例房源：照常展示，但不被搜索引擎收录 */
  isSample: boolean;
  updatedAt: string | null;
}

/** City Guide 点位。extra 里放各类点位自己的附加信息（行业分类、图标、图片署名等） */
export interface GuidePlace {
  id: number;
  kind: "neighborhood" | "business" | "school" | "landmark" | "company" | "commute";
  name: Bi;
  desc: Bi;
  lat: number | null;
  lng: number | null;
  address: string;
  area: Bi;
  logo: Media | null;
  images: Media[];
  extra: Record<string, unknown>;
}

export interface Guide {
  region: string;
  /** 占位内容（复制自其他地区）：照常展示，但不被收录 */
  isPlaceholder: boolean;
  payload: Record<string, unknown>;
  places: GuidePlace[];
  updatedAt: string | null;
}

/** POST /leads 的请求体 */
export interface LeadInput {
  name: string;
  email: string;
  message: string;
  type: "renter" | "partner" | "press" | "other";
  region?: string;
  sourcePath: string;
  sourceEnv: "staging" | "production";
  locale: "en" | "zh";
  /** 蜜罐字段，真人不会填 */
  website?: string;
}
