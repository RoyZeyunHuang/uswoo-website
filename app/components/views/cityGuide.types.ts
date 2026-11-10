import type { Bi } from "~~/shared/types/api";

/**
 * City Guide 的 payload（GET /guides/{region} 返回的 payload 字段）。
 * 各城市不同的内容都在这里；各城市通用的文案（页面标题、筛选项、图例等）在页面内容 city-guides 里。
 * 导入文件由 tools/seed-guides.mjs 生成，见 seed/guides/<region>.json。
 */

/** 图片或文件：payload 里写 { "url": "/assets/…" }；CMS 里换成 { "mediaId": n } 后接口会展开出 url，所以一律读 .url */
export interface GuideFile {
  url: string;
}

/** 一张区域卡片 */
export interface GuideArea {
  emoji: string;
  name: Bi;
  /** 卡片底部的小标签（学校缩写、地名等，通常两种语言相同） */
  tags: Bi[];
  /** 桌面端显示的完整介绍 */
  text: Bi;
  /** 手机上显示的简短介绍；留空则手机上不单独显示 */
  short: Bi;
  image: GuideFile;
}

/** 区域卡片之后的收尾卡片（引导联系 USWOO） */
export interface GuideClosing {
  emoji: string;
  title: Bi;
  text: Bi;
  short: Bi;
  image: GuideFile;
  /** 手机上是否隐藏这张卡片 */
  hideOnMobile: boolean;
}

export interface GuideMapConfig {
  center: { lat: number; lng: number };
  /** 按 256px 瓦片（Leaflet）口径填写，地图初始化时会减 1 换算成 MapLibre 的层级 */
  zoom: number;
  minZoom: number;
  /** 城市范围 [[南, 西], [北, 东]]，地图只能在它周围一定范围内拖动 */
  bounds: [[number, number], [number, number]];
  /** 社区边界 GeoJSON：每个 feature 的 properties.name 与 neighborhood 点位的英文名对应 */
  neighborhoods: GuideFile;
  /** 商务区边界 GeoJSON：properties.name 与 business 点位的英文名对应 */
  businessDistricts: GuideFile;
  /** 轨道交通 GeoJSON：properties.kind 为 line（system / ref / name / color / text_color）或 station（system / name / refs） */
  transit: GuideFile;
}

export interface GuidePayload {
  /** 标题里显示的城市名（汇总页用；地区页用地区自己的名称） */
  cityName: Bi;
  emoji: string;
  /** 「Neighborhoods」标题下的导语，同时用作页面描述 */
  intro: Bi;
  areas: GuideArea[];
  closing: GuideClosing;
  map: GuideMapConfig;
  /** 可选：覆盖默认生成的页面标题与描述 */
  seo?: { title?: Bi; description?: Bi };
}

/** 图片署名（来自 Wikimedia Commons），放在点位的 extra.credits 里 */
export interface PlaceCredit {
  file: string;
  author: string;
  license: string;
}

/**
 * 点位 extra 字段里用到的键（都可省略）：
 *   credits      所有类型：图片署名
 *   icon         landmark / company：地图徽标的图形；企业的 icon 同时表示行业
 *   hub          school：学校所在片区
 *   communities  school：学生常住的社区
 */
export interface PlaceExtra {
  credits?: PlaceCredit[];
  icon?: string;
  hub?: Bi;
  communities?: string[];
}

/** 地图上可开关的四类内容 */
export type GuideFilter = "neighborhood" | "school" | "business" | "commute";
