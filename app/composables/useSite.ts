/**
 * 全站通用内容：导航、页脚、各页面共用的按钮文字等，来自 CMS「新官网页面 → 全站通用」。
 * 地区可以覆盖其中一部分（例如该地区自己的导航或页脚）：在带地区的网址上（/{region}/…）取的是
 * 「该地区的内容盖在全站默认之上」的版本，其他网址取全站默认。同一个页面里多处调用只请求一次。
 *
 * global: true —— 不管当前在哪个地区都取全站默认。站点名称、favicon、默认分享图不随地区变化
 * （app.vue 用它取 favicon，同时让 usePageSeo 读的 "page:site:" 这份数据在地区页上也存在）。
 */
export function useSite(options: { global?: boolean } = {}) {
  const route = useRoute();
  const param = route.params.region;
  // 与导航里记住地区时用的格式一致；地区是否真实存在由各页面的 useRegion 先行校验（不存在即 404）
  const region = !options.global && typeof param === "string" && /^[a-z-]{2,40}$/.test(param) ? param : undefined;
  return usePageContent("site", region);
}
