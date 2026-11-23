/**
 * 楼盘介绍与设施的临时资料：CMS 里的楼盘还没有 description / amenities 字段时，页面先用这里的内容顶上。
 * 这是占位文案（43 Cottage 的介绍与前三项设施取自用户提供，其余设施是常见配置；另外三栋楼的内容整理自公开的租赁网站，均尚未向楼盘核实），CMS 里填了以后会自动优先用 CMS 的，这里可以删掉。
 */
interface Fallback {
  description: { en: string; zh: string };
  amenities: { title: { en: string; zh: string }; items: { en: string[]; zh: string[] } }[];
}

export const BUILDING_FALLBACK: Record<string, Fallback> = {
  "43-cottage": {
    description: {
      en: "Discover modern luxury living at 43 Cottage, located in Jersey City's vibrant Journal Square neighborhood.\nFeaturing stylish residences, contemporary finishes, and amenities including a fitness center, coworking spaces, and a rooftop terrace, 43 Cottage offers comfort and convenience.\nJust steps from the Journal Square PATH station, residents enjoy easy access to Manhattan, dining, shopping, and more.",
      zh: "在泽西城充满活力的 Journal Square 社区，体验 43 Cottage 的现代奢华生活。\n这里有时尚的住宅、现代感十足的装修，以及健身房、联合办公空间和屋顶露台等配套，舒适又便利。\n步行即可到达 Journal Square PATH 车站，轻松前往曼哈顿，周边餐饮、购物一应俱全。"
    },
    amenities: [
      { title: { en: "Building", zh: "楼内设施" }, items: { en: ["Fitness center", "Coworking spaces", "Rooftop terrace", "Resident lounge", "Package room", "Pet friendly", "Laundry", "Doorman"], zh: ["健身房", "联合办公空间", "屋顶露台", "住户休息室", "包裹间", "可养宠物", "洗衣房", "门卫服务"] } }
    ]
  }  ,
  "505-summit": {
    description: {
      en: "505 Summit is a 605-home rental tower in Jersey City's Journal Square neighborhood, with studio to three-bedroom residences.\nThe building pairs skyline views with a full amenity program, including a rooftop pool terrace, coworking space, a resident lounge and a game room.\nA 24-hour concierge and package room keep daily life easy, and the PATH station is close by for a quick trip into Manhattan.",
      zh: "505 Summit 位于泽西城 Journal Square 社区，是一栋拥有 605 套住宅的租赁大楼，户型从开间到三居室。\n大楼可以看到曼哈顿天际线，配套齐全，有屋顶泳池露台、联合办公空间、住户休息室和游戏室。\n24 小时礼宾和包裹间让日常生活更省心，附近就是 PATH 车站，去曼哈顿很方便。"
    },
    amenities: [
      { title: { en: "Building", zh: "楼内设施" }, items: { en: ["Rooftop pool terrace", "Coworking spaces", "Resident lounge", "Game room", "24-hour concierge", "Package room", "Dog run"], zh: ["屋顶泳池露台", "联合办公空间", "住户休息室", "游戏室", "24 小时礼宾", "包裹间", "宠物活动区"] } }
    ]
  },
  "forten-at-columbia": {
    description: {
      en: "Forten at Columbia is a new rental tower at 410 West 126th Street, in the Manhattanville area of Harlem near Columbia University's Manhattanville campus.\nResidences offer floor-to-ceiling windows and quartz countertops, and the building adds a fitness center, a resident lounge and a rooftop terrace with an outdoor pool.\nAn attended lobby with a doorman makes arrivals easy, and the building is pet friendly.",
      zh: "Forten at Columbia 是一栋位于西 126 街 410 号的新建租赁大楼，在哈莱姆的 Manhattanville 一带，靠近哥伦比亚大学 Manhattanville 校区。\n住宅有落地窗和石英石台面，楼内配有健身房、住户休息室，以及带室外泳池的屋顶露台。\n大堂有门卫值守，进出方便，也欢迎养宠物。"
    },
    amenities: [
      { title: { en: "Building", zh: "楼内设施" }, items: { en: ["Doorman", "Fitness center", "Rooftop terrace", "Outdoor pool", "Resident lounge", "Mail room", "Pet friendly"], zh: ["门卫服务", "健身房", "屋顶露台", "室外泳池", "住户休息室", "邮件间", "可养宠物"] } }
    ]
  },
  "1440-amsterdam-ave": {
    description: {
      en: "1440 Amsterdam Ave is a large new rental building in West Harlem, close to Columbia University, with studio to two-bedroom homes.\nIts standout feature is more than 60,000 square feet of indoor and outdoor amenity space, including a fitness center, basketball court, golf simulator and rooftop terrace.\nResidents also get wellness and yoga space, a game room, a bike room and a 24-hour concierge.",
      zh: "1440 Amsterdam Ave 是西哈莱姆的大型新建租赁大楼，靠近哥伦比亚大学，户型从开间到两居室。\n大楼最大的特色是超过 6 万平方英尺的室内外公共空间，包括健身房、篮球场、高尔夫模拟器和屋顶露台。\n住户还能使用瑜伽与健康空间、游戏室、自行车房，并享有 24 小时礼宾服务。"
    },
    amenities: [
      { title: { en: "Building", zh: "楼内设施" }, items: { en: ["Fitness center", "Basketball court", "Golf simulator", "Rooftop terrace", "Yoga & wellness", "Game room", "Bike room", "24-hour concierge"], zh: ["健身房", "篮球场", "高尔夫模拟器", "屋顶露台", "瑜伽与健康空间", "游戏室", "自行车房", "24 小时礼宾"] } }
    ]
  }
};

// 其他城市的示例楼盘也走同一套兜底（介绍与设施），见 demoBuildings.ts
for (const item of DEMO_BUILDINGS) BUILDING_FALLBACK[item.slug] = { description: item.description, amenities: item.amenities };
