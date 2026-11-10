/**
 * City Guide 的地图：MapLibre GL + OpenFreeMap 矢量瓦片（免费、无需密钥、可商用）。
 * 逻辑移植自原站页面脚本，数据源、图层、绘制参数与事件保持一致；区别只在数据来自 CMS 的点位而不是写死的常量。
 * 只在浏览器里使用（由视图的 onMounted 调用）。
 */
import type { Bi, GuidePlace } from "~~/shared/types/api";
import type { GuideFilter, GuideMapConfig, PlaceExtra } from "../cityGuide.types";

// ---- MapLibre 用到的那部分类型（库从 CDN 按需加载，项目里没有装它的类型包）----

type LngLat = [number, number];
type Expression = unknown[];
interface MlPoint {
  x: number;
  y: number;
}
interface MlFeature {
  id?: number | string;
  source: string;
  layer: { id: string };
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
}
interface MlMouseEvent {
  point: MlPoint;
  lngLat: { lng: number; lat: number };
  originalEvent?: Event;
}
interface MlLayer {
  id: string;
  type: string;
  source?: string;
  filter?: Expression;
  minzoom?: number;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
}
interface MlStyle {
  layers: MlLayer[];
  [key: string]: unknown;
}
interface MlMap {
  on(type: "load" | "move", listener: () => void): void;
  on(type: "mousemove" | "click", listener: (event: MlMouseEvent) => void): void;
  remove(): void;
  resize(): void;
  fitBounds(bounds: [LngLat, LngLat], options: Record<string, unknown>): void;
  addControl(control: unknown, position: string): void;
  getStyle(): MlStyle;
  addSource(id: string, source: Record<string, unknown>): void;
  getSource(id: string): unknown;
  addLayer(layer: MlLayer, beforeId?: string): void;
  getLayer(id: string): unknown;
  setLayoutProperty(layerId: string, name: string, value: unknown): void;
  getLayoutProperty(layerId: string, name: string): unknown;
  setFilter(layerId: string, filter: Expression): void;
  setFeatureState(target: { source: string; id: number | string }, state: Record<string, unknown>): void;
  queryRenderedFeatures(geometry: MlPoint | [LngLat, LngLat], options: { layers: string[] }): MlFeature[];
  hasImage(id: string): boolean;
  addImage(id: string, image: HTMLImageElement | ImageData, options: { pixelRatio: number }): void;
  getCanvas(): HTMLCanvasElement;
  getContainer(): HTMLElement;
  project(lngLat: LngLat): MlPoint;
  touchZoomRotate: { disableRotation(): void };
}
interface MlMarker {
  setLngLat(lngLat: LngLat): MlMarker;
  addTo(map: MlMap): MlMarker;
  remove(): void;
}
interface MapLibre {
  Map: new (options: Record<string, unknown>) => MlMap;
  Marker: new (options: { element: HTMLElement; anchor?: string; offset?: [number, number] }) => MlMarker;
  NavigationControl: new (options: { showCompass: boolean }) => unknown;
}

interface GeoFeature {
  type: "Feature";
  id?: number;
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
}
interface GeoCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

// ---- 常量（与原站一致）----

/** 与原站相同的版本与来源 */
const MAPLIBRE_JS = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
const MAPLIBRE_CSS = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";

/** 底图用 OpenFreeMap 的 positron 样式，再按 USWOO 的配色重新上色 */
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const MAP_PALETTE = {
  land: "#F6F5F3",
  residential: "#F1EFEC",
  park: "#E6EBDF",
  wood: "#DFE5D8",
  water: "#DFE5E8",
  waterway: "#D3DBDF",
  waterLabel: "#7D8D96",
  building: "#ECE9E5",
  buildingLine: "#E2DED9",
  road: "#FFFFFF",
  roadCasing: "#E7E4E0",
  minor: "#FFFFFF",
  path: "#EFECE8",
  motorway: "#FFFFFF",
  motorwayCasing: "#DCD7D1",
  rail: "#DAD6D1",
  label: "#656260",
  labelStrong: "#141414",
  halo: "#FFFFFF",
  boundary: "#C9C4BE"
};

type MarkerKind = "school" | "business" | "commute" | "neighborhood";
const MARKER_COLOR: Record<MarkerKind, string> = { school: "#E8892B", business: "#E2B33F", commute: "#8FA6C9", neighborhood: "#C9536B" };
const CATEGORY_ICON_SVG: Record<MarkerKind, string> = {
  school:
    '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" style="width:14px;height:14px"><path d="M22 10 12 4 2 10l10 6 10-6z"/><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/></svg>',
  business:
    '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" style="width:14px;height:14px"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  neighborhood: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" style="width:14px;height:14px"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>',
  commute:
    '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" style="width:14px;height:14px"><path d="M12 2c-3 0-6 1-6 5v8a3 3 0 0 0 3 3l-1.5 2h9L15 18a3 3 0 0 0 3-3V7c0-4-3-5-6-5z"/><circle cx="8.5" cy="15" r="0.6" fill="#fff"/><circle cx="15.5" cy="15" r="0.6" fill="#fff"/></svg>'
};

type AreaKind = "neighborhood" | "business";
const AREA_KINDS: Record<AreaKind, { id: string; color: string; ink: string; dash?: number[] }> = {
  neighborhood: { id: "nb", color: "#C9536B", ink: "#9E3A50" },
  business: { id: "bd", color: "#C98A14", ink: "#8A5A00", dash: [3, 1.6] }
};
const AREA_KIND_LIST: AreaKind[] = ["neighborhood", "business"];

type PoiCat = "landmark" | "company";
const POI_COLOR: Record<PoiCat, string> = { landmark: "#2F8F83", company: "#4A5FC1" };
/** 企业的行业（extra.icon）；名称在 CMS 的 map.sectors.<行业> 里 */
const POI_SECTORS = ["finance", "tech", "media", "consulting", "health", "consumer"];
/** 24×24 的线条图形（在类别底色上画成白色） */
const POI_GLYPH: Record<string, string> = {
  statue: '<path d="M12 2.5v3.5M10.2 4.2l1.8 1.8 1.8-1.8M9.5 22h5M10 22l.8-10.5h2.4L14 22M10.8 11.5 9 8.5M13.2 11.5 12 7"/><path d="M8 22h8"/>',
  tower: '<path d="M8 22V7l4-4 4 4v15M5 22h14M10.5 10h3M10.5 14h3M10.5 18h3"/>',
  bridge: '<path d="M2 17h20M4 17v4M20 17v4M4 17c3.5-8 12.5-8 16 0M8 12.6V17M12 11.2V17M16 12.6V17"/>',
  park: '<path d="M12 22v-5M12 3 6 13h3.5L6.5 17h11L14.5 13H18z"/>',
  museum: '<path d="M3 21h18M5 18h14M12 3l9 5H3zM6 10.5V18M10 10.5V18M14 10.5V18M18 10.5V18"/>',
  venue: '<path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.15 1 5.85L12 16.9l-5.25 2.8 1-5.85L3.5 9.7l5.9-.9z"/>',
  train: '<rect x="6" y="3" width="12" height="13" rx="3"/><path d="M6 10h12M9.5 13h.01M14.5 13h.01M9 16l-2.5 4.5M15 16l2.5 4.5"/>',
  square: '<rect x="3.5" y="4" width="17" height="11" rx="1.5"/><path d="M12 15v6M8 21h8M7 8.5h5M7 11.5h10"/>',
  finance: '<path d="M3 17.5l6-6 4 4 8-8M15 7.5h6v6"/>',
  tech: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19.5h20"/>',
  media: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M7 8.5h10M7 12h4M7 15.5h4M13.5 12H17v3.5h-3.5z"/>',
  consulting: '<rect x="3" y="7.5" width="18" height="12.5" rx="2"/><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M3 13h18"/>',
  health: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/>',
  consumer: '<path d="M5.5 8h13l-1 13h-11zM9 10V6.5a3 3 0 0 1 6 0V10"/>'
};
const ROW_ICON = {
  pin: '<path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z"/><circle cx="12" cy="10" r="2.4"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V21H3z"/><path d="M9.5 21v-6h5v6"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.8a3.2 3.2 0 0 1 0 6.4M18 14.3c1.8.8 3 2.6 3 4.7"/>'
};

// ---- 纯函数 ----

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escHtml = (text: unknown) => String(text ?? "").replace(/[&<>"']/g, char => ESCAPES[char] ?? char);

function brandStyle(style: MlStyle): MlStyle {
  const P = MAP_PALETTE;
  const paint: Record<string, Record<string, string>> = {
    background: { "background-color": P.land },
    park: { "fill-color": P.park },
    water: { "fill-color": P.water },
    landuse_residential: { "fill-color": P.residential },
    landcover_wood: { "fill-color": P.wood },
    waterway: { "line-color": P.waterway },
    building: { "fill-color": P.building, "fill-outline-color": P.buildingLine },
    road_area_pier: { "fill-color": P.land },
    road_pier: { "line-color": P.land },
    highway_path: { "line-color": P.path },
    highway_minor: { "line-color": P.minor },
    highway_major_casing: { "line-color": P.roadCasing },
    highway_major_inner: { "line-color": P.road },
    highway_major_subtle: { "line-color": P.roadCasing },
    highway_motorway_casing: { "line-color": P.motorwayCasing },
    highway_motorway_inner: { "line-color": P.motorway },
    highway_motorway_subtle: { "line-color": P.motorwayCasing },
    highway_motorway_bridge_casing: { "line-color": P.motorwayCasing },
    highway_motorway_bridge_inner: { "line-color": P.motorway },
    tunnel_motorway_casing: { "line-color": P.roadCasing },
    tunnel_motorway_inner: { "line-color": P.road },
    railway_transit: { "line-color": P.rail },
    railway_service: { "line-color": P.rail },
    railway: { "line-color": P.rail },
    boundary_2: { "line-color": P.boundary },
    boundary_3: { "line-color": P.boundary },
    water_name_point_label: { "text-color": P.waterLabel },
    water_name_line_label: { "text-color": P.waterLabel },
    waterway_line_label: { "text-color": P.waterLabel }
  };
  style.layers.forEach(layer => {
    if (layer.id === "ne2_shaded" || layer.source === "ne2_shaded") layer.layout = { ...layer.layout, visibility: "none" };
    const recolor = paint[layer.id];
    if (recolor) layer.paint = { ...layer.paint, ...recolor };
    if (layer.type === "symbol" && !recolor && layer.paint && "text-color" in layer.paint) {
      const strong = /^label_(city|town|state|country)/.test(layer.id);
      layer.paint = { ...layer.paint, "text-color": strong ? P.labelStrong : P.label, "text-halo-color": P.halo, "text-halo-width": 1.2, "text-halo-blur": 0.4 };
    }
  });
  return style;
}

const fetchJson = <T>(url: string): Promise<T> =>
  fetch(url).then(response => {
    if (!response.ok) throw new Error(url);
    return response.json() as Promise<T>;
  });

let brandStylePromise: Promise<MlStyle> | null = null;
function loadBrandStyle(): Promise<MlStyle> {
  if (!brandStylePromise) {
    brandStylePromise = fetchJson<MlStyle>(MAP_STYLE_URL)
      .then(brandStyle)
      .catch((error: unknown) => {
        brandStylePromise = null;
        throw error;
      });
  }
  return brandStylePromise;
}

const globalLib = () => (window as unknown as { maplibregl?: MapLibre }).maplibregl;
let libPromise: Promise<MapLibre> | null = null;
/** 按需加载 MapLibre：与原站一样从 unpkg 取脚本和样式，但只在进入本页面后才加载 */
function loadMapLibre(): Promise<MapLibre> {
  const ready = globalLib();
  if (ready) return Promise.resolve(ready);
  if (!libPromise) {
    libPromise = new Promise<MapLibre>((resolve, reject) => {
      if (!document.querySelector(`link[href="${MAPLIBRE_CSS}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = MAPLIBRE_CSS;
        document.head.appendChild(link);
      }
      const script = document.createElement("script");
      script.src = MAPLIBRE_JS;
      script.async = true;
      script.onload = () => {
        const lib = globalLib();
        if (lib) resolve(lib);
        else reject(new Error("maplibre-gl"));
      };
      script.onerror = () => {
        // 允许下次进入页面时重试
        libPromise = null;
        script.remove();
        reject(new Error("maplibre-gl"));
      };
      document.head.appendChild(script);
    });
  }
  return libPromise;
}

/** 任意 GeoJSON 几何的外包框 [[西, 南], [东, 北]]；没有坐标时返回 null */
function geoBounds(features: GeoFeature[]): [LngLat, LngLat] | null {
  const box = [Infinity, Infinity, -Infinity, -Infinity] as [number, number, number, number];
  const walk = (node: unknown) => {
    if (!Array.isArray(node)) return;
    if (typeof node[0] === "number" && typeof node[1] === "number") {
      box[0] = Math.min(box[0], node[0]);
      box[1] = Math.min(box[1], node[1]);
      box[2] = Math.max(box[2], node[0]);
      box[3] = Math.max(box[3], node[1]);
    } else node.forEach(walk);
  };
  features.forEach(feature => walk(feature.geometry.coordinates));
  return box[0] === Infinity
    ? null
    : [
        [box[0], box[1]],
        [box[2], box[3]]
      ];
}

/** 以给定点为圆心、半径若干米的近似圆：区域没有真实边界时用它代替 */
function circlePolygon(lng: number, lat: number, radius: number) {
  const points: LngLat[] = [];
  const R = 6378137;
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const angle = (i / n) * 2 * Math.PI;
    points.push([
      +(lng + ((radius * Math.sin(angle)) / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI)).toFixed(5),
      +(lat + ((radius * Math.cos(angle)) / R) * (180 / Math.PI)).toFixed(5)
    ]);
  }
  return { type: "Polygon", coordinates: [points] };
}

/** 企业徽标：白底圆盘 + 企业色描边 + 居中的 logo（按 2 倍尺寸栅格化）。加载失败或跨域读不了像素时返回 null */
function logoBadgeImage(src: string): Promise<ImageData | null> {
  return new Promise(resolve => {
    const image = new Image();
    // 画布要取像素，图片必须同源：媒体库 CDN 上的 logo 经站内的 /_site/media 转发（CDN 不带跨域响应头）
    image.crossOrigin = "anonymous";
    if (/^https?:\/\//.test(src) && !src.startsWith(location.origin)) src = `/_site/media?url=${encodeURIComponent(src)}`;
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 60;
        const g = canvas.getContext("2d");
        if (!g) return resolve(null);
        g.beginPath();
        g.arc(30, 30, 27, 0, 2 * Math.PI);
        g.fillStyle = "#fff";
        g.fill();
        g.lineWidth = 3.5;
        g.strokeStyle = POI_COLOR.company;
        g.stroke();
        g.save();
        g.beginPath();
        g.arc(30, 30, 23, 0, 2 * Math.PI);
        g.clip();
        const scale = Math.min(34 / image.width, 34 / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        g.drawImage(image, 30 - width / 2, 30 - height / 2, width, height);
        g.restore();
        resolve(g.getImageData(0, 0, 60, 60));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

const poiImageId = (cat: string, icon: string) => `cg-poi-${cat}-${icon}`;
/** 图形徽标：类别底色圆盘、白色描边、白色图形（按 2 倍尺寸栅格化，边缘更清晰） */
function poiBadgeImage(cat: PoiCat, icon: string): Promise<HTMLImageElement | null> {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 28 28">' +
    `<circle cx="14" cy="14" r="12.5" fill="${POI_COLOR[cat]}" stroke="#fff" stroke-width="2"/>` +
    `<g transform="translate(6.8 6.8) scale(0.6)" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${POI_GLYPH[icon] ?? ""}</g></svg>`;
  return new Promise(resolve => {
    const image = new Image(56, 56);
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

// ---- 悬浮卡片 ----

interface CardRow {
  icon: keyof typeof ROW_ICON;
  text: string;
}
interface Card {
  color: string;
  tags: string[];
  name: string;
  desc?: string;
  images?: string[];
  credits?: string[];
  /** 图片署名那一行的文案，其中 {authors} 换成作者名单 */
  creditLabel?: string;
  rows?: CardRow[];
  extraHtml?: string;
}

/** 各类点位共用的卡片：最多三张图，然后是类别、名称、简介和带图标的信息行 */
function placeCardHtml(card: Card): string {
  const photos = (card.images ?? []).slice(0, 3);
  const credit = (card.credits ?? []).filter(Boolean);
  const rows = (card.rows ?? []).filter(row => row.text);
  return (
    '<div class="cg-poicard">' +
    (photos.length ? `<div class="pc-photos n${photos.length}">${photos.map(src => `<img src="${escHtml(src)}" alt="">`).join("")}</div>` : "") +
    '<div class="pc-body">' +
    `<div class="pc-cat" style="color:${card.color}"><i style="background:${card.color}"></i>${card.tags.map(tag => `<span>${escHtml(tag)}</span>`).join("<span>·</span>")}</div>` +
    `<div class="pc-title">${escHtml(card.name)}</div>` +
    (card.desc ? `<p class="pc-desc">${escHtml(card.desc)}</p>` : "") +
    (card.extraHtml ?? "") +
    (rows.length ? `<div class="pc-meta">${rows.map(row => `<div class="pc-row"><svg viewBox="0 0 24 24">${ROW_ICON[row.icon]}</svg><span>${escHtml(row.text)}</span></div>`).join("")}</div>` : "") +
    (credit.length ? `<div class="pc-credit">${escHtml((card.creditLabel ?? "").replace("{authors}", credit.join(", ")))}</div>` : "") +
    "</div></div>"
  );
}

// ---- 地图本体 ----

export interface GuideMapOptions {
  /** 地图容器（需要有尺寸） */
  container: HTMLElement;
  /** 悬浮卡片挂在哪个元素下：样式限定在页面根元素之内，所以不能像原站那样直接挂到 body */
  tipHost: HTMLElement;
  config: GuideMapConfig;
  places: GuidePlace[];
  /** 当前打开的筛选项；一个都没选时按原站的做法仍显示社区 */
  filters: () => GuideFilter[];
  /** 取 CMS 页面内容 city-guides 里的文案（当前语言），如 label("map.kinds.school") */
  label: (path: string) => string;
  bi: (value: Bi | null | undefined) => string;
  isZh: () => boolean;
}

export interface GuideMapHandle {
  /** 筛选项变化后重画 */
  paint: () => void;
  destroy: () => void;
}

interface Located {
  place: GuidePlace;
  /** 英文名：与边界文件里的 properties.name 对应，也是地图上的标注文字 */
  name: string;
  lat: number;
  lng: number;
}

export function createGuideMap(options: GuideMapOptions): GuideMapHandle {
  const { container, tipHost, config, places, label, bi } = options;
  const creditLabel = () => label("map.photoCredit");

  let destroyed = false;
  let lib: MapLibre | null = null;
  let map: MlMap | null = null;
  let mapLoaded = false;
  let markerLayer: MlMarker[] = [];
  let areaShapes: Partial<Record<AreaKind, Set<string>>> = {};
  let lineStyle: Record<string, Record<string, unknown>> = {};
  let nbData: GeoCollection | null | undefined;
  let bdData: GeoCollection | null | undefined;
  let tipEl: HTMLDivElement | null = null;
  let tipAnchor: { lngLat: LngLat; gap: number } | null = null;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const located: Located[] = places.flatMap(place => (typeof place.lat === "number" && typeof place.lng === "number" ? [{ place, name: place.name.en, lat: place.lat, lng: place.lng }] : []));
  const ofKind = (kind: GuidePlace["kind"]) => located.filter(item => item.place.kind === kind);
  const extraOf = (place: GuidePlace) => (place.extra ?? {}) as PlaceExtra;
  const imagesOf = (place: GuidePlace) => (place.images ?? []).map(image => image.url).filter(Boolean);
  const creditsOf = (place: GuidePlace) => {
    const credits = extraOf(place).credits;
    return Array.isArray(credits) ? credits.map(credit => credit?.author ?? "") : [];
  };
  const activeFilters = (): GuideFilter[] => {
    const list = options.filters();
    return list.length ? list : ["neighborhood"];
  };
  const wait = (ms: number) => new Promise<void>(resolve => timers.push(setTimeout(resolve, ms)));

  // ---- 悬浮卡片：固定定位，锚在地图上的一个点，并保持在屏幕之内 ----

  function positionTip() {
    if (!tipEl || !tipAnchor || !map) return;
    const rect = map.getContainer().getBoundingClientRect();
    const point = map.project(tipAnchor.lngLat);
    const x = rect.left + point.x;
    const y = rect.top + point.y;
    const width = tipEl.offsetWidth;
    const height = tipEl.offsetHeight;
    const margin = 10;
    // 优先放在点的上方，放不下就翻到下方
    let top = y - tipAnchor.gap - height;
    if (top < margin) top = Math.min(y + tipAnchor.gap, window.innerHeight - height - margin);
    const left = Math.max(margin, Math.min(x - width / 2, window.innerWidth - width - margin));
    tipEl.style.transform = `translate(${Math.round(left)}px,${Math.round(Math.max(margin, top))}px)`;
  }

  function showTip(html: string, lngLat: LngLat, gap?: number) {
    if (!tipEl) {
      tipEl = document.createElement("div");
      tipEl.className = "cg-floattip";
      tipHost.appendChild(tipEl);
      window.addEventListener("scroll", positionTip, { passive: true });
      window.addEventListener("resize", positionTip);
    }
    tipEl.innerHTML = html;
    tipAnchor = { lngLat, gap: gap || 12 };
    positionTip();
    tipEl.classList.add("on");
  }

  function hideTip() {
    tipEl?.classList.remove("on");
    tipAnchor = null;
  }

  // ---- 各类卡片的内容 ----

  function areaCardHtml(kind: AreaKind, name: string): string {
    const K = AREA_KINDS[kind];
    const place = ofKind(kind).find(item => item.name === name)?.place;
    return placeCardHtml({
      color: K.color,
      tags: [label(`map.kinds.${kind}`)],
      name: place ? bi(place.name) : name,
      images: place ? imagesOf(place) : [],
      credits: place ? creditsOf(place) : [],
      creditLabel: creditLabel(),
      desc: place ? bi(place.desc) : "",
      rows: [{ icon: "pin", text: place ? bi(place.area) : "" }]
    });
  }

  function schoolCardHtml(place: GuidePlace): string {
    const extra = extraOf(place);
    const communities = Array.isArray(extra.communities) ? extra.communities : [];
    return placeCardHtml({
      color: MARKER_COLOR.school,
      tags: [label("map.kinds.school")],
      name: bi(place.name),
      images: imagesOf(place),
      credits: creditsOf(place),
      creditLabel: creditLabel(),
      desc: bi(place.desc),
      rows: [
        { icon: "pin", text: bi(place.area) || bi(extra.hub) },
        { icon: "home", text: place.address },
        { icon: "people", text: communities.length ? label("map.popularAreas").replace("{areas}", communities.join(options.isZh() ? "、" : ", ")) : "" }
      ]
    });
  }

  /** 地标 / 知名企业 */
  function poiCardHtml(place: GuidePlace): string {
    const cat: PoiCat = place.kind === "company" ? "company" : "landmark";
    const icon = String(extraOf(place).icon ?? "");
    const sector = POI_SECTORS.includes(icon) ? label(`map.sectors.${icon}`) : "";
    return placeCardHtml({
      color: POI_COLOR[cat],
      tags: [label(`map.kinds.${cat}`), ...(sector ? [sector] : [])],
      name: bi(place.name),
      desc: bi(place.desc),
      images: imagesOf(place),
      credits: creditsOf(place),
      creditLabel: creditLabel(),
      rows: [
        { icon: "pin", text: bi(place.area) },
        { icon: "home", text: place.address }
      ]
    });
  }

  function transitCardHtml(props: Record<string, unknown>, isStation: boolean): string {
    const system = String(props.system ?? "");
    const refs = isStation
      ? String(props.refs ?? "")
          .split(",")
          .filter(Boolean)
      : [String(props.ref ?? "")];
    const badges =
      '<div class="pc-lines">' +
      refs
        .map(ref => {
          const style = lineStyle[`${system}|${ref}`] ?? {};
          return `<b style="background:${escHtml(style.color || "#656260")};color:${escHtml(style.text_color || "#FFFFFF")}" title="${escHtml(style.name || ref)}">${escHtml(ref)}</b>`;
        })
        .join("") +
      "</div>";
    return placeCardHtml({
      color: MARKER_COLOR.commute,
      tags: [label(isStation ? "map.kinds.station" : "map.kinds.line"), system],
      name: String(isStation ? (props.name ?? "") : props.name || props.ref || ""),
      extraHtml: badges
    });
  }

  // ---- 图层 ----

  /** 地标跟随「社区」视图，知名企业跟随「商务区」视图 */
  function poiFilter(): Expression {
    const filters = activeFilters();
    const cats: string[] = [];
    if (filters.includes("neighborhood")) cats.push("landmark");
    if (filters.includes("business")) cats.push("company");
    return ["in", ["get", "cat"], ["literal", cats]];
  }

  function addTransitLayers(target: MlMap, transit: GeoCollection, beforeId?: string) {
    if (target.getSource("cg-tr")) return;
    lineStyle = {};
    transit.features.forEach(feature => {
      if (feature.properties.kind === "line") lineStyle[`${String(feature.properties.system)}|${String(feature.properties.ref)}`] = feature.properties;
    });
    const visibility = activeFilters().includes("commute") ? "visible" : "none";
    target.addSource("cg-tr", { type: "geojson", data: transit });
    const isLine: Expression = ["==", ["get", "kind"], "line"];
    const isStation: Expression = ["==", ["get", "kind"], "station"];
    target.addLayer(
      {
        id: "cg-tr-casing",
        type: "line",
        source: "cg-tr",
        filter: isLine,
        layout: { visibility, "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FFFFFF", "line-width": ["interpolate", ["linear"], ["zoom"], 9, 2.6, 12, 4.6, 15, 8] }
      },
      beforeId
    );
    target.addLayer(
      {
        id: "cg-tr-line",
        type: "line",
        source: "cg-tr",
        filter: isLine,
        layout: { visibility, "line-join": "round", "line-cap": "round" },
        paint: { "line-color": ["get", "color"], "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1.4, 12, 2.8, 15, 5] }
      },
      beforeId
    );
    target.addLayer({
      id: "cg-tr-station",
      type: "circle",
      source: "cg-tr",
      filter: isStation,
      minzoom: 10.5,
      layout: { visibility },
      paint: {
        "circle-color": "#FFFFFF",
        "circle-stroke-color": "#141414",
        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 10.5, 0.8, 14, 1.6],
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10.5, 1.6, 13, 3.2, 15, 5]
      }
    });
    target.addLayer({
      id: "cg-tr-name",
      type: "symbol",
      source: "cg-tr",
      filter: isStation,
      minzoom: 13,
      layout: { visibility, "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": 10, "text-anchor": "left", "text-offset": [0.7, 0], "text-optional": true },
      paint: { "text-color": "#3B3936", "text-halo-color": "#FFFFFF", "text-halo-width": 1.3 }
    });
  }

  /**
   * 画在地图里的图层：社区与商务区的边界（填充、描边、名称）、地标与企业的徽标、轨道交通。
   */
  function addOverlayLayers(target: MlMap) {
    const pois = [...ofKind("landmark"), ...ofKind("company")].map((item, index) => {
      const cat = item.place.kind as PoiCat;
      const icon = String(extraOf(item.place).icon ?? "");
      const logo = cat === "company" ? (item.place.logo?.url ?? "") : "";
      return {
        type: "Feature" as const,
        geometry: { type: "Point", coordinates: [item.lng, item.lat] },
        properties: { name: item.name, cat, icon, logo, img: logo ? "cg-logo-" + logo : poiImageId(cat, icon), rank: cat === "landmark" ? 0 : 1, index }
      };
    });
    const poiPlaces = [...ofKind("landmark"), ...ofKind("company")].map(item => item.place);
    const firstLabel = target.getStyle().layers.find(layer => layer.type === "symbol")?.id;
    // 面积大的先画，小的压在上面，保证都能被鼠标指到
    const areaOf = (feature: GeoFeature) => {
      const box = geoBounds([feature]);
      return box ? (box[1][0] - box[0][0]) * (box[1][1] - box[0][1]) : 0;
    };
    const hover = (on: number, off: number): Expression => ["case", ["boolean", ["feature-state", "hover"], false], on, off];
    areaShapes = {};
    AREA_KIND_LIST.forEach(kind => {
      const K = AREA_KINDS[kind];
      const data = kind === "business" ? bdData : nbData;
      const points = ofKind(kind);
      const features: GeoFeature[] = [...(data?.features ?? [])];
      // 没有真实边界的区域：以它的点位为圆心画一个约 600 米的圆代替
      const known = new Set(features.map(feature => String(feature.properties.name)));
      points
        .filter(point => !known.has(point.name))
        .forEach(point => features.push({ type: "Feature", properties: { name: point.name, approx: true }, geometry: circlePolygon(point.lng, point.lat, 600) }));
      const shaped = new Set(features.map(feature => String(feature.properties.name)));
      areaShapes[kind] = shaped;
      const sorted = features
        .slice()
        .sort((a, b) => areaOf(b) - areaOf(a))
        .map((feature, index) => ({ type: "Feature", id: index, properties: feature.properties, geometry: feature.geometry }));
      const labelPoints = points
        .filter(point => shaped.has(point.name))
        .map(point => ({ type: "Feature", properties: { name: point.name }, geometry: { type: "Point", coordinates: [point.lng, point.lat] } }));
      const source = "cg-" + K.id;
      target.addSource(source, { type: "geojson", data: { type: "FeatureCollection", features: sorted } });
      target.addSource(source + "-label", { type: "geojson", data: { type: "FeatureCollection", features: labelPoints } });
      target.addLayer({ id: source + "-fill", type: "fill", source, paint: { "fill-color": K.color, "fill-opacity": hover(0.3, 0.1) } }, firstLabel);
      target.addLayer(
        { id: source + "-line", type: "line", source, paint: { "line-color": K.color, "line-opacity": 0.9, "line-width": hover(2.6, 1.4), ...(K.dash ? { "line-dasharray": K.dash } : {}) } },
        firstLabel
      );
      target.addLayer({
        id: source + "-name",
        type: "symbol",
        source: source + "-label",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Bold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 9, 9.5, 13, 12.5],
          "text-transform": "uppercase",
          "text-letter-spacing": 0.06,
          "text-max-width": 8
        },
        paint: { "text-color": K.ink, "text-halo-color": "rgba(255,255,255,0.92)", "text-halo-width": 1.4 }
      });
    });

    // 「通勤」视图用的轨道线路与站点
    if (config.transit?.url) {
      fetchJson<GeoCollection>(config.transit.url)
        .catch(() => null)
        .then(transit => {
          if (transit && !destroyed) addTransitLayers(target, transit, firstLabel);
        });
    }

    target.addSource("cg-poi", { type: "geojson", data: { type: "FeatureCollection", features: pois } });
    // 徽标要异步栅格化，注册完再加图层。徽标互相重叠时自动隐藏（地标优先）
    const kinds: Record<string, { cat: PoiCat; icon: string; logo: string }> = {};
    pois.forEach(feature => (kinds[feature.properties.img] = feature.properties));
    // logo 徽标比图形徽标略大一点更好认
    const logoSize = (value: number): Expression => ["case", ["!=", ["get", "logo"], ""], +(value * 1.2).toFixed(3), value];
    Promise.all(
      Object.entries(kinds).map(async ([id, kind]) => {
        // logo 加载不了时退回行业图形，免得这个点在地图上消失
        const image = (kind.logo ? await logoBadgeImage(kind.logo) : null) ?? (await poiBadgeImage(kind.cat, kind.icon));
        if (image && !destroyed && !target.hasImage(id)) target.addImage(id, image, { pixelRatio: 2 });
      })
    ).then(() => {
      if (destroyed || target.getLayer("cg-poi-icon")) return;
      target.addLayer({
        id: "cg-poi-icon",
        type: "symbol",
        source: "cg-poi",
        filter: poiFilter(),
        layout: {
          "icon-image": ["get", "img"],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 9, logoSize(0.62), 12, logoSize(0.85), 15, logoSize(1.05)],
          "icon-allow-overlap": false,
          "icon-padding": 1,
          "symbol-sort-key": ["get", "rank"],
          "text-field": ["step", ["zoom"], "", 12.4, ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": 10.5,
          "text-anchor": "top",
          "text-offset": [0, 1.25],
          "text-max-width": 7,
          "text-optional": true
        },
        paint: { "text-color": "#3B3936", "text-halo-color": "#FFFFFF", "text-halo-width": 1.3 }
      });
    });

    let hovered: { source: string; id: number | string } | null = null;
    let shownKey: string | null = null;
    const unhover = () => {
      if (hovered) target.setFeatureState(hovered, { hover: false });
      hovered = null;
    };
    const clearHover = () => {
      unhover();
      hideTip();
      shownKey = null;
      target.getCanvas().style.cursor = "";
    };
    const fillLayers = () => AREA_KIND_LIST.map(kind => `cg-${AREA_KINDS[kind].id}-fill`).filter(id => target.getLayoutProperty(id, "visibility") !== "none");
    // 徽标优先于它下面的区域；商务区在社区之上。
    // 区域的卡片固定在该区域的标注点上，不跟着鼠标跑。
    const onMove = (event: MlMouseEvent) => {
      // DOM 标记（学校、兜底图钉）的鼠标事件会冒泡到地图上；它们自己会显示卡片
      const origin = event.originalEvent?.target;
      if (origin instanceof Element && origin.closest(".maplibregl-marker")) {
        unhover();
        shownKey = null;
        target.getCanvas().style.cursor = "";
        return;
      }
      const poi = target.getLayer("cg-poi-icon") ? target.queryRenderedFeatures(event.point, { layers: ["cg-poi-icon"] })[0] : undefined;
      const transitLayers = ["cg-tr-station", "cg-tr-line"].filter(id => target.getLayer(id) && target.getLayoutProperty(id, "visibility") !== "none");
      const rank = (feature: MlFeature) => (feature.layer.id === "cg-tr-station" ? 0 : 1);
      const transit =
        !poi && transitLayers.length
          ? target
              .queryRenderedFeatures(
                [
                  [event.point.x - 4, event.point.y - 4],
                  [event.point.x + 4, event.point.y + 4]
                ],
                { layers: transitLayers }
              )
              .sort((a, b) => rank(a) - rank(b))[0]
          : undefined;
      const layers = fillLayers();
      const zone = !poi && !transit && layers.length ? target.queryRenderedFeatures(event.point, { layers })[0] : undefined;
      if (!poi && !transit && !zone) {
        clearHover();
        return;
      }
      const here: LngLat = [event.lngLat.lng, event.lngLat.lat];
      if (transit) {
        unhover();
        target.getCanvas().style.cursor = "pointer";
        const props = transit.properties;
        const key = `tr|${transit.layer.id}|${String(props.system)}|${String(props.name || "")}|${String(props.ref || "")}`;
        if (shownKey !== key) {
          shownKey = key;
          const at = transit.geometry.type === "Point" ? (transit.geometry.coordinates as LngLat) : here;
          showTip(transitCardHtml(props, transit.layer.id === "cg-tr-station"), at, 10);
        }
        return;
      }
      target.getCanvas().style.cursor = "pointer";
      if (poi) {
        unhover();
        const key = "poi|" + String(poi.properties.name);
        if (shownKey !== key) {
          shownKey = key;
          const place = poiPlaces[Number(poi.properties.index)];
          if (place) showTip(poiCardHtml(place), poi.geometry.coordinates as LngLat, 16);
        }
        return;
      }
      if (!zone) return;
      const kind: AreaKind = zone.source === "cg-bd" ? "business" : "neighborhood";
      if (zone.id !== undefined && (!hovered || hovered.source !== zone.source || hovered.id !== zone.id)) {
        unhover();
        hovered = { source: zone.source, id: zone.id };
        target.setFeatureState(hovered, { hover: true });
      }
      const name = String(zone.properties.name);
      const key = `${kind}|${name}`;
      if (shownKey !== key) {
        shownKey = key;
        const point = ofKind(kind).find(item => item.name === name);
        showTip(areaCardHtml(kind, name), point ? [point.lng, point.lat] : here, 10);
      }
    };
    target.on("mousemove", onMove);
    // 触屏：点一下查看
    target.on("click", onMove);
    target.getCanvas().addEventListener("mouseleave", clearHover);
  }

  // ---- DOM 标记与图层显隐 ----

  function paint() {
    if (!map || !lib || destroyed) return;
    const target = map;
    const ml = lib;
    markerLayer.forEach(marker => marker.remove());
    markerLayer = [];
    const filters = activeFilters();
    if (mapLoaded) {
      AREA_KIND_LIST.forEach(kind => {
        const visibility = filters.includes(kind) ? "visible" : "none";
        ["-fill", "-line", "-name"].forEach(suffix => target.setLayoutProperty(`cg-${AREA_KINDS[kind].id}${suffix}`, "visibility", visibility));
      });
      if (target.getLayer("cg-poi-icon")) target.setFilter("cg-poi-icon", poiFilter());
      const showTransit = filters.includes("commute") ? "visible" : "none";
      ["cg-tr-casing", "cg-tr-line", "cg-tr-station", "cg-tr-name"].forEach(id => {
        if (target.getLayer(id)) target.setLayoutProperty(id, "visibility", showTransit);
      });
      hideTip();
    }
    const pin = (html: string) => {
      const node = document.createElement("div");
      node.className = "cg-pin";
      node.innerHTML = html;
      return node;
    };
    const badge = (cat: MarkerKind, logo: string) =>
      cat === "school" && logo
        ? `<div class="cg-marker cg-logo"><img src="${escHtml(logo)}" alt=""></div>`
        : `<div class="cg-marker" style="background:${MARKER_COLOR[cat]};flex:none;">${CATEGORY_ICON_SVG[cat]}</div>`;
    const labeledIcon = (cat: MarkerKind, name: string, logo: string) =>
      pin(
        '<div style="display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:visible;">' +
          badge(cat, logo) +
          `<span style="background:#fff;padding:3px 8px;border-radius:3px;font-size:11.5px;font-weight:600;color:#141414;box-shadow:0 1px 4px rgba(0,0,0,0.25);">${escHtml(name)}</span></div>`
      );
    const plainIcon = (cat: MarkerKind) => pin(`<div class="cg-marker" style="background:${MARKER_COLOR[cat]}">${CATEGORY_ICON_SVG[cat]}</div>`);
    // 带文字的标记：徽标中心对准坐标点，文字向右延伸
    const add = (lat: number, lng: number, node: HTMLElement, html: () => string, labelOffset?: number) => {
      const marker = new ml.Marker(labelOffset ? { element: node, anchor: "left", offset: [-labelOffset, 0] } : { element: node }).setLngLat([lng, lat]).addTo(target);
      const show = () => showTip(html(), [lng, lat], 18);
      node.addEventListener("mouseenter", show);
      node.addEventListener("mouseleave", hideTip);
      node.addEventListener("click", event => {
        event.stopPropagation();
        if (tipEl?.classList.contains("on")) hideTip();
        else show();
      });
      markerLayer.push(marker);
    };
    filters.forEach(filter => {
      if (filter === "school") {
        ofKind("school").forEach(school => {
          const logo = school.place.logo?.url ?? "";
          add(school.lat, school.lng, labeledIcon("school", bi(school.place.name), logo), () => schoolCardHtml(school.place), logo ? 16 : 13);
        });
      } else if (filter === "business" || filter === "neighborhood") {
        // 区域画成边界；只有拿不到形状的才退回成图钉
        if (!mapLoaded) return;
        const shaped = areaShapes[filter] ?? new Set<string>();
        ofKind(filter)
          .filter(point => !shaped.has(point.name))
          .forEach(point => add(point.lat, point.lng, plainIcon(filter), () => areaCardHtml(filter, point.name)));
      }
      // 通勤直接画成轨道交通网络（cg-tr-* 图层），没有枢纽图钉
    });
  }

  function initMap(ml: MapLibre, style: MlStyle) {
    if (map || destroyed) return;
    // 以社区边界为准取景（手工填写的中心点可能偏向一侧）
    const nbBounds = geoBounds(nbData?.features ?? []);
    const [[south, west], [north, east]] = config.bounds;
    // MapLibre 把整个视口（不只是中心点）限制在 maxBounds 之内，所以要把城市范围向外放大，否则视图会被挤偏
    const padY = (north - south) * 1.2;
    const padX = (east - west) * 1.5;
    try {
      // MapLibre 用 512px 瓦片，同样的视野比 Leaflet 的层级小 1
      map = new ml.Map({
        container,
        style,
        center: [config.center.lng, config.center.lat],
        zoom: config.zoom - 1,
        minZoom: config.minZoom - 1,
        maxZoom: 16,
        maxBounds: [
          [west - padX, south - padY],
          [east + padX, north + padY]
        ],
        scrollZoom: false,
        dragRotate: false,
        pitchWithRotate: false,
        attributionControl: { compact: true }
      });
      const created = map;
      if (nbBounds) created.fitBounds(nbBounds, { padding: 36, duration: 0, maxZoom: 13 });
      created.touchZoomRotate.disableRotation();
      created.addControl(new ml.NavigationControl({ showCompass: false }), "top-left");
      created.on("move", positionTip);
      created.on("load", () => {
        if (destroyed) return;
        addOverlayLayers(created);
        mapLoaded = true;
        paint();
      });
      paint();
      // 容器尺寸在图片加载、布局稳定的过程中会变，多校正几次
      [50, 400, 1000].forEach(delay =>
        timers.push(
          setTimeout(() => {
            try {
              if (!destroyed) created.resize();
            } catch {
              /* 地图已销毁 */
            }
          }, delay)
        )
      );
    } catch {
      /* 浏览器不支持 WebGL 等：保留空白的地图框，页面其余内容不受影响 */
    }
  }

  async function start() {
    const loadBoundary = (url: string | undefined) => (url ? fetchJson<GeoCollection>(url).catch(() => null) : Promise.resolve(null));
    const dataReady = Promise.all([
      loadBoundary(config.neighborhoods?.url).then(data => (nbData = data)),
      loadBoundary(config.businessDistricts?.url).then(data => (bdData = data))
    ]);
    const [ml, style] = await Promise.all([loadMapLibre(), loadBrandStyle()]);
    lib = ml;
    // 边界数据最多等 4 秒，等不到就先出图（区域会画成近似圆）
    await Promise.race([dataReady, wait(4000)]);
    // 容器要有尺寸才能初始化（例如还在被隐藏的面板里）
    for (let attempt = 0; attempt < 100 && !destroyed && !(container.offsetWidth > 0 && container.offsetHeight > 0); attempt++) await wait(100);
    if (destroyed || !(container.offsetWidth > 0 && container.offsetHeight > 0)) return;
    // 样式对象全页共用一份缓存，交给地图前复制一份
    initMap(ml, JSON.parse(JSON.stringify(style)) as MlStyle);
  }

  start().catch(() => {
    /* 地图库或底图样式加载失败：保留空白的地图框 */
  });

  return {
    paint,
    destroy() {
      destroyed = true;
      timers.splice(0).forEach(timer => clearTimeout(timer));
      markerLayer.forEach(marker => {
        try {
          marker.remove();
        } catch {
          /* 忽略 */
        }
      });
      markerLayer = [];
      hideTip();
      window.removeEventListener("scroll", positionTip);
      window.removeEventListener("resize", positionTip);
      tipEl?.remove();
      tipEl = null;
      try {
        map?.remove();
      } catch {
        /* 忽略 */
      }
      map = null;
      mapLoaded = false;
    }
  };
}
