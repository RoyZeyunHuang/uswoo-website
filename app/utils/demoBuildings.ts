/**
 * 其他城市（芝加哥、洛杉矶等）的示例楼盘：用来先把这些城市的房源页与楼盘页的设计跑通，可以点进去看。
 * 楼盘名、价格、介绍和设施都是占位资料，不是真实楼盘；真实楼盘录进 CMS（buildings.items）后，把这里对应的条目删掉即可。
 * 图片先用该城市的封面图（地区接口里的 cover），所以这里不放图片地址。
 */
interface Bi { en: string; zh: string }
export interface DemoBuilding {
  slug: string;
  region: string;
  name: Bi;
  address: Bi;
  tag: Bi;
  startingPrice: number;
  summary: Bi;
  description: Bi;
  amenities: { title: Bi; items: { en: string[]; zh: string[] } }[];
}

const TAG: Bi = { en: "SAMPLE", zh: "示例" };
const BUILDING: Bi = { en: "Building", zh: "楼内设施" };

export const DEMO_BUILDINGS: DemoBuilding[] = [
  {
    slug: "chicago-loop-residences", region: "chicago", tag: TAG, startingPrice: 2400,
    name: { en: "Loop Residences", zh: "Loop 公寓" },
    address: { en: "The Loop, Chicago, IL", zh: "芝加哥 Loop 市中心" },
    summary: { en: "Studio – 2 BR", zh: "开间 – 两居室" },
    description: {
      en: "A sample listing for Chicago's Loop, close to the L, the river and the city's main offices and campuses.\nThis page shows how a Chicago building will look once real listings are added.",
      zh: "这是芝加哥 Loop 市中心的示例楼盘，靠近 L 线地铁、芝加哥河以及主要的写字楼和校园。\n这一页用来展示芝加哥楼盘上线后的样子，真实楼盘录入后会替换。"
    },
    amenities: [{ title: BUILDING, items: { en: ["Fitness center", "Coworking spaces", "Rooftop terrace", "Resident lounge", "Package room", "Doorman"], zh: ["健身房", "联合办公空间", "屋顶露台", "住户休息室", "包裹间", "门卫服务"] } }]
  },
  {
    slug: "chicago-river-north-lofts", region: "chicago", tag: TAG, startingPrice: 2650,
    name: { en: "River North Lofts", zh: "River North 阁楼公寓" },
    address: { en: "River North, Chicago, IL", zh: "芝加哥 River North" },
    summary: { en: "Studio – 3 BR", zh: "开间 – 三居室" },
    description: {
      en: "A sample listing for River North, with loft-style homes near galleries, restaurants and the Chicago Riverwalk.\nReplace this with a real building when it is ready.",
      zh: "这是 River North 的示例楼盘，阁楼风格的住宅，周边有画廊、餐厅和芝加哥河滨步道。\n真实楼盘准备好后在这里替换。"
    },
    amenities: [{ title: BUILDING, items: { en: ["Fitness center", "Rooftop terrace", "Outdoor pool", "Pet friendly", "Game room", "24-hour concierge"], zh: ["健身房", "屋顶露台", "室外泳池", "可养宠物", "游戏室", "24 小时礼宾"] } }]
  },
  {
    slug: "la-downtown-tower", region: "los-angeles", tag: TAG, startingPrice: 2900,
    name: { en: "Downtown Tower", zh: "市中心大厦" },
    address: { en: "Downtown, Los Angeles, CA", zh: "洛杉矶市中心" },
    summary: { en: "Studio – 2 BR", zh: "开间 – 两居室" },
    description: {
      en: "A sample listing for Downtown Los Angeles, near USC, the Arts District and Metro lines.\nThis page shows the layout of a Los Angeles building before real listings are added.",
      zh: "这是洛杉矶市中心的示例楼盘，靠近南加大、艺术区和地铁线路。\n这一页用来展示洛杉矶楼盘的版式，真实楼盘录入后会替换。"
    },
    amenities: [{ title: BUILDING, items: { en: ["Fitness center", "Outdoor pool", "Rooftop terrace", "Coworking spaces", "Pet friendly", "Doorman"], zh: ["健身房", "室外泳池", "屋顶露台", "联合办公空间", "可养宠物", "门卫服务"] } }]
  },
  {
    slug: "la-westwood-residences", region: "los-angeles", tag: TAG, startingPrice: 3200,
    name: { en: "Westwood Residences", zh: "Westwood 公寓" },
    address: { en: "Westwood, Los Angeles, CA", zh: "洛杉矶 Westwood" },
    summary: { en: "Studio – 2 BR", zh: "开间 – 两居室" },
    description: {
      en: "A sample listing for Westwood, a short trip from the UCLA campus, shops and dining.\nReplace this with a real building when it is ready.",
      zh: "这是 Westwood 的示例楼盘，离加州大学洛杉矶分校校园、商店和餐饮都很近。\n真实楼盘准备好后在这里替换。"
    },
    amenities: [{ title: BUILDING, items: { en: ["Fitness center", "Resident lounge", "Coworking spaces", "Package room", "Pet friendly", "24-hour concierge"], zh: ["健身房", "住户休息室", "联合办公空间", "包裹间", "可养宠物", "24 小时礼宾"] } }]
  },
  {
    slug: "dc-dupont-residences", region: "washington-dc", tag: TAG, startingPrice: 2600,
    name: { en: "Dupont Residences", zh: "Dupont 公寓" },
    address: { en: "Dupont Circle, Washington, D.C.", zh: "华盛顿特区 Dupont Circle" },
    summary: { en: "Studio – 2 BR", zh: "开间 – 两居室" },
    description: {
      en: "A sample listing for Dupont Circle, steps from the Metro, cafés and embassies.\nThis page shows how a Washington, D.C. building will look once real listings are added.",
      zh: "这是 Dupont Circle 的示例楼盘，步行即到地铁、咖啡馆和各国使馆。\n这一页用来展示华盛顿特区楼盘上线后的样子，真实楼盘录入后会替换。"
    },
    amenities: [{ title: BUILDING, items: { en: ["Fitness center", "Rooftop terrace", "Resident lounge", "Package room", "Doorman", "Pet friendly"], zh: ["健身房", "屋顶露台", "住户休息室", "包裹间", "门卫服务", "可养宠物"] } }]
  },
  {
    slug: "dc-navy-yard-lofts", region: "washington-dc", tag: TAG, startingPrice: 2800,
    name: { en: "Navy Yard Lofts", zh: "Navy Yard 阁楼公寓" },
    address: { en: "Navy Yard, Washington, D.C.", zh: "华盛顿特区 Navy Yard" },
    summary: { en: "Studio – 2 BR", zh: "开间 – 两居室" },
    description: {
      en: "A sample listing for Navy Yard, by the Anacostia waterfront, the ballpark and the Metro.\nReplace this with a real building when it is ready.",
      zh: "这是 Navy Yard 的示例楼盘，临近阿纳科斯蒂亚河滨、棒球场和地铁。\n真实楼盘准备好后在这里替换。"
    },
    amenities: [{ title: BUILDING, items: { en: ["Fitness center", "Outdoor pool", "Coworking spaces", "Game room", "Pet friendly", "24-hour concierge"], zh: ["健身房", "室外泳池", "联合办公空间", "游戏室", "可养宠物", "24 小时礼宾"] } }]
  },
  {
    slug: "philly-rittenhouse-residences", region: "philadelphia", tag: TAG, startingPrice: 2100,
    name: { en: "Rittenhouse Residences", zh: "Rittenhouse 公寓" },
    address: { en: "Rittenhouse Square, Philadelphia, PA", zh: "费城 Rittenhouse Square" },
    summary: { en: "Studio – 2 BR", zh: "开间 – 两居室" },
    description: {
      en: "A sample listing for Rittenhouse Square, near the park, Center City dining and the city's universities.\nThis page shows how a Philadelphia building will look once real listings are added.",
      zh: "这是 Rittenhouse Square 的示例楼盘，靠近公园、市中心餐饮和费城的几所大学。\n这一页用来展示费城楼盘上线后的样子，真实楼盘录入后会替换。"
    },
    amenities: [{ title: BUILDING, items: { en: ["Fitness center", "Resident lounge", "Rooftop terrace", "Package room", "Doorman", "Pet friendly"], zh: ["健身房", "住户休息室", "屋顶露台", "包裹间", "门卫服务", "可养宠物"] } }]
  },
  {
    slug: "philly-university-city-lofts", region: "philadelphia", tag: TAG, startingPrice: 1900,
    name: { en: "University City Lofts", zh: "University City 阁楼公寓" },
    address: { en: "University City, Philadelphia, PA", zh: "费城 University City" },
    summary: { en: "Studio – 3 BR", zh: "开间 – 三居室" },
    description: {
      en: "A sample listing for University City, close to Penn and Drexel, with quick transit into Center City.\nReplace this with a real building when it is ready.",
      zh: "这是 University City 的示例楼盘，靠近宾大和德雷塞尔大学，坐车很快到市中心。\n真实楼盘准备好后在这里替换。"
    },
    amenities: [{ title: BUILDING, items: { en: ["Fitness center", "Coworking spaces", "Game room", "Laundry", "Pet friendly", "Package room"], zh: ["健身房", "联合办公空间", "游戏室", "洗衣房", "可养宠物", "包裹间"] } }]
  },
  {
    slug: "boston-back-bay-residences", region: "boston", tag: TAG, startingPrice: 3100,
    name: { en: "Back Bay Residences", zh: "Back Bay 公寓" },
    address: { en: "Back Bay, Boston, MA", zh: "波士顿 Back Bay" },
    summary: { en: "Studio – 2 BR", zh: "开间 – 两居室" },
    description: {
      en: "A sample listing for Back Bay, near the Charles River, Newbury Street and the T.\nThis page shows how a Boston building will look once real listings are added.",
      zh: "这是 Back Bay 的示例楼盘，靠近查尔斯河、Newbury 街和地铁（T 线）。\n这一页用来展示波士顿楼盘上线后的样子，真实楼盘录入后会替换。"
    },
    amenities: [{ title: BUILDING, items: { en: ["Fitness center", "Rooftop terrace", "Resident lounge", "Package room", "Doorman", "Pet friendly"], zh: ["健身房", "屋顶露台", "住户休息室", "包裹间", "门卫服务", "可养宠物"] } }]
  },
  {
    slug: "boston-fenway-lofts", region: "boston", tag: TAG, startingPrice: 2800,
    name: { en: "Fenway Lofts", zh: "Fenway 阁楼公寓" },
    address: { en: "Fenway, Boston, MA", zh: "波士顿 Fenway" },
    summary: { en: "Studio – 2 BR", zh: "开间 – 两居室" },
    description: {
      en: "A sample listing for Fenway, close to Northeastern, Berklee and the Green Line.\nReplace this with a real building when it is ready.",
      zh: "这是 Fenway 的示例楼盘，靠近东北大学、伯克利音乐学院和绿线地铁。\n真实楼盘准备好后在这里替换。"
    },
    amenities: [{ title: BUILDING, items: { en: ["Fitness center", "Coworking spaces", "Game room", "Rooftop terrace", "Pet friendly", "24-hour concierge"], zh: ["健身房", "联合办公空间", "游戏室", "屋顶露台", "可养宠物", "24 小时礼宾"] } }]
  }
];
