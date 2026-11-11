/**
 * 房源与媒体报道页面的界面功能性文案（英文原文 → 中文）：加载状态、无障碍标签、单位、日期与阅读时长的格式。
 * 带 {…} 的是格式模板，代码里取到后再把占位符换成具体的值。
 */
export default {
  Home: "首页",
  Leased: "已租出",
  Studio: "开间",
  "Load more": "加载更多",
  "Loading…": "加载中…",
  "Filter by city": "按城市筛选",
  "Previous photo": "上一张",
  "Next photo": "下一张",
  "Show photo {n}": "查看第 {n} 张照片",
  "View All Photos": "查看全部照片",
  Close: "关闭",
  Enquire: "咨询",
  Share: "分享",
  "Link copied": "链接已复制",
  Overview: "概览",
  Location: "位置",
  "{n} bed": "{n} 间卧室",
  "{n} beds": "{n} 间卧室",
  "{n} bath": "{n} 间卫生间",
  "{n} baths": "{n} 间卫生间",
  "{n} sqft": "{n} 平方英尺",
  "{n} min read": "{n} 分钟阅读",
  "{month} {day}, {year}": "{year}年{monthNumber}月{day}日",
  "Draft preview — not published yet. This link expires in 30 minutes.": "草稿预览：这个页面还没有发布，链接 30 分钟内有效",
  // 房源角标是接口返回的数据，中文页显示对应的中文
  Exclusive: "独家"
} as Record<string, string>;
