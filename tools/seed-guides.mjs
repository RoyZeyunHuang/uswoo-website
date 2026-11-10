#!/usr/bin/env node
/**
 * 把原站 City Guides 页面里写死的各城市数据转成 CMS 的导入文件。可重复执行，产物每次整份重写。
 *
 *   node tools/seed-guides.mjs
 *
 * 数据来源：
 *   legacy/USWOO City Guides.dc.html      页面脚本里的 AREA_GUIDES / CITY_DATA / NY_POIS 等常量（用 vm 求值，不执行页面逻辑）
 *   legacy/i18n-zh.js、i18n-zh-cities.js  中文字典
 *   public/assets/places/*.json、poi/*.json、school-logos/index.json、company-logos/index.json  点位的介绍、图片与 logo
 *   public/assets/neighborhoods.geojson、business-districts.geojson  各城市混在一起的边界
 *
 * 产物：
 *   seed/guides/<region>.json                              { region, payload, places }，payload 的结构见 app/components/views/cityGuide.types.ts
 *   public/assets/guides/<region>/neighborhoods.geojson    按地区拆开的社区边界
 *   public/assets/guides/<region>/business-districts.geojson  按地区拆开的商务区边界
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const legacy = path.join(root, "legacy");
const assets = path.join(root, "public/assets");
const readJson = (...parts) => JSON.parse(fs.readFileSync(path.join(...parts), "utf8"));
const writeJson = (file, data, indent = 1) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, indent) + "\n");
};

/** 原站的城市名 → 新站的地区 slug。顺序沿用原站的城市切换顺序。 */
const REGION_OF = {
  "New York & New Jersey": "new-york",
  "Los Angeles": "los-angeles",
  "Washington, D.C.": "washington-dc",
  Chicago: "chicago",
  Philadelphia: "philadelphia"
};

// ---------------------------------------------------------------------------
// 原站数据
// ---------------------------------------------------------------------------
function loadLegacyData() {
  const html = fs.readFileSync(path.join(legacy, "USWOO City Guides.dc.html"), "utf8");
  const script = /<script[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!script) throw new Error("City Guides 页面里没有找到脚本");
  // 顶层的 const 不会挂到沙箱对象上，末尾补一句把要用的常量导出来
  const exported = "AREA_GUIDES, AREA_ART, CITIES, CITY_EMOJI, CITY_DATA, CITY_KEY, CITY_POIS";
  const sandbox = { DCLogic: class {}, __out: null };
  vm.createContext(sandbox);
  vm.runInContext(`${script[1]}\n;__out = { ${exported} };`, sandbox, { filename: "city-guides.js" });
  return sandbox.__out;
}

function loadDictionary() {
  const sandbox = { window: {}, matchMedia: () => ({ matches: false }) };
  sandbox.window.matchMedia = sandbox.matchMedia;
  vm.createContext(sandbox);
  for (const file of ["i18n-zh.js", "i18n-zh-cities.js"]) vm.runInContext(fs.readFileSync(path.join(legacy, file), "utf8"), sandbox, { filename: file });
  const dict = {};
  for (const [key, value] of Object.entries(sandbox.window.USWOO_ZH ?? {})) if (typeof value === "string") dict[norm(key)] = value;
  return dict;
}

const norm = text => String(text).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();

const data = loadLegacyData();
const dict = loadDictionary();
const areaInfo = readJson(assets, "places/areas.json");
const schoolInfo = readJson(assets, "places/schools.json");
const poiInfo = readJson(assets, "poi/poi.json");
const poiExtra = readJson(assets, "poi/poi-extra.json");
const schoolLogos = readJson(assets, "school-logos/index.json");
const companyLogos = readJson(assets, "company-logos/index.json");
const neighborhoods = readJson(assets, "neighborhoods.geojson");
const districts = readJson(assets, "business-districts.geojson");

// ---------------------------------------------------------------------------
// 小工具
// ---------------------------------------------------------------------------
const zhOf = english => (english ? (dict[norm(english)] ?? "") : "");
/** 双语值：中文优先用给定的，其次查字典；都没有就留空（页面会回退到英文） */
const bi = (english, chinese) => ({ en: english ?? "", zh: chinese || zhOf(english) });
/** 名称类：字典里没有译名的地名、站名按原站的做法保留英文 */
const biName = english => ({ en: english, zh: zhOf(english) || english });
/** 原站的相对路径（./assets/x、assets/x）→ 站内绝对路径 */
const assetPath = file => (file ? "/" + String(file).replace(/^\.?\//, "") : null);
const credits = list => (list ?? []).map(item => ({ file: item.file ?? "", author: item.author ?? "", license: item.license ?? "" }));

function splitGeojson(collection, cityKey, file) {
  const features = collection.features.filter(feature => feature.properties.city === cityKey);
  // 边界文件体积大，不缩进
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ type: "FeatureCollection", features }) + "\n");
  return features;
}

// ---------------------------------------------------------------------------
// 逐个地区生成
// ---------------------------------------------------------------------------
const summary = [];

for (const city of data.CITIES) {
  const region = REGION_OF[city];
  if (!region) throw new Error(`没有给「${city}」配置地区 slug`);
  const key = data.CITY_KEY[city];
  const guide = data.AREA_GUIDES[city];
  const config = data.CITY_DATA[city];

  const nbFeatures = splitGeojson(neighborhoods, key, path.join(assets, "guides", region, "neighborhoods.geojson"));
  const bdFeatures = splitGeojson(districts, key, path.join(assets, "guides", region, "business-districts.geojson"));

  /** @type {Record<string, unknown>} */
  const payload = {
    cityName: biName(city),
    emoji: data.CITY_EMOJI[city] ?? "",
    intro: bi(guide.intro),
    areas: guide.areas.map(area => ({
      emoji: area.emoji,
      name: biName(area.name),
      // 原站的标签不翻译（学校缩写、地名）
      tags: area.tags.map(tag => ({ en: tag, zh: tag })),
      text: bi(area.text),
      short: bi(area.short ?? ""),
      image: { url: assetPath(data.AREA_ART[area.name]) }
    })),
    closing: {
      emoji: "✨",
      title: bi("Found your area?"),
      text: bi(guide.closing),
      short: bi("Once you know your area, we can help with the rest, from apartment search to move-in essentials."),
      image: { url: assetPath(data.AREA_ART[`${city}:note`] || data.AREA_ART.note) },
      // 原站只有纽约在手机上保留这张收尾卡片
      hideOnMobile: !/^New York/.test(city)
    },
    map: {
      center: { lat: config.center.lat, lng: config.center.lng },
      zoom: config.zoom,
      minZoom: config.minZoom,
      bounds: config.bounds,
      neighborhoods: { url: `/assets/guides/${region}/neighborhoods.geojson` },
      businessDistricts: { url: `/assets/guides/${region}/business-districts.geojson` },
      transit: { url: `/assets/transit/${key}.geojson` }
    }
  };

  const places = [];
  const push = place => places.push({ ...place, sort: places.length + 1 });
  const markers = config.markers;

  // 社区点位大多没有自带简介：同名商务区有简介时沿用
  const markerDesc = {};
  for (const point of [...(markers.business ?? []), ...(markers.neighborhood ?? [])]) if (point.desc && !markerDesc[point.name]) markerDesc[point.name] = point.desc;

  for (const kind of ["neighborhood", "business"]) {
    for (const point of markers[kind] ?? []) {
      const info = areaInfo.find(item => item.kind === kind && item.city === key && item.name === point.name) ?? {};
      const english = info.desc || point.desc || markerDesc[point.name] || "";
      push({
        kind,
        name: biName(point.name),
        desc: bi(english, info.desc ? info.desc_zh : ""),
        lat: point.lat,
        lng: point.lng,
        address: "",
        area: bi(info.region ?? "", info.region_zh),
        logo: null,
        images: (info.images ?? []).map(assetPath),
        extra: { credits: credits(info.credits) }
      });
    }
  }

  for (const school of config.schools) {
    const info = schoolInfo.find(item => item.city === key && item.name === school.name) ?? {};
    push({
      kind: "school",
      name: biName(school.name),
      desc: bi(info.desc ?? "", info.desc_zh),
      lat: school.lat,
      lng: school.lng,
      address: info.address ?? "",
      // 没有单独写所在社区的学校用原站的 hub 顶上
      area: info.neighborhood ? bi(info.neighborhood, info.neighborhood_zh) : bi(school.hub),
      logo: assetPath(schoolLogos[school.name]),
      images: (info.images ?? []).map(assetPath),
      extra: { hub: bi(school.hub), communities: school.communities, credits: credits(info.credits) }
    });
  }

  // 地标与知名企业：纽约的坐标写在脚本里、介绍在 poi.json；其他城市整条都在 poi-extra.json
  const pois = [...(data.CITY_POIS[key] ?? []).map(poi => ({ ...poi, ...(poiInfo[poi.name] ?? {}) })), ...poiExtra.filter(poi => poi.city === key)];
  for (const cat of ["landmark", "company"]) {
    for (const poi of pois.filter(item => item.cat === cat)) {
      push({
        kind: cat,
        name: biName(poi.name),
        desc: bi(poi.desc ?? "", poi.desc_zh),
        lat: poi.lat,
        lng: poi.lng,
        address: poi.address ?? "",
        area: bi(poi.neighborhood ?? "", poi.neighborhood_zh),
        logo: cat === "company" ? assetPath(companyLogos[poi.name]) : null,
        images: (poi.images ?? []).map(assetPath),
        // icon：地图徽标用的图形；企业的 icon 同时表示行业（finance / tech / media / consulting / health / consumer）
        extra: { icon: poi.icon ?? "", credits: credits(poi.credits) }
      });
    }
  }

  // 通勤枢纽：原站地图上已改为直接画轨道交通线路，这些点只作为文字资料保留
  for (const point of markers.commute ?? []) {
    push({ kind: "commute", name: biName(point.name), desc: bi(""), lat: point.lat, lng: point.lng, address: "", area: bi(""), logo: null, images: [], extra: {} });
  }

  // 校验：引用的图片都在 public/ 里；边界和点位能按名称对上
  const missing = [];
  const check = file => file && !fs.existsSync(path.join(root, "public", file)) && missing.push(file);
  payload.areas.forEach(area => check(area.image.url));
  check(payload.closing.image.url);
  Object.values(payload.map).forEach(value => value && typeof value === "object" && "url" in value && check(value.url));
  places.forEach(place => [place.logo, ...place.images].forEach(check));
  if (missing.length) throw new Error(`${region}: 找不到这些文件：\n  ${missing.join("\n  ")}`);
  const unmatched = [
    ...nbFeatures.filter(feature => !(markers.neighborhood ?? []).some(point => point.name === feature.properties.name)).map(feature => `neighborhood:${feature.properties.name}`),
    ...bdFeatures.filter(feature => !(markers.business ?? []).some(point => point.name === feature.properties.name)).map(feature => `business:${feature.properties.name}`)
  ];

  writeJson(path.join(root, "seed/guides", `${region}.json`), { region, payload, places });

  const byKind = {};
  for (const place of places) byKind[place.kind] = (byKind[place.kind] ?? 0) + 1;
  const noZh = places.filter(place => place.desc.en && !place.desc.zh).length + payload.areas.filter(area => !area.text.zh || !area.short.zh).length + (payload.intro.zh ? 0 : 1) + (payload.closing.text.zh ? 0 : 1);
  summary.push({ region, areas: payload.areas.length, places: places.length, ...byKind, boundaries: `${nbFeatures.length}+${bdFeatures.length}`, "missing zh": noZh, "boundary w/o place": unmatched.join(", ") || "-" });
}

console.table(summary);
console.log(`seed/guides/*.json × ${summary.length}，public/assets/guides/<region>/*.geojson × ${summary.length * 2}`);
