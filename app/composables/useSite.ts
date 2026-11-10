/**
 * 全站通用内容：导航、页脚、各页面共用的按钮文字等，来自 CMS「新官网页面 → 全站通用」。
 * 全站只请求一次，导航、页脚和页面里可以各自调用。
 */
export function useSite() {
  return usePageContent("site");
}
