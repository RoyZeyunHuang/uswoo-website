import type { H3Event } from "h3";

/**
 * 服务端路由里请求公开接口（站点地图等）。与页面里的 useApi 走同一组地址：
 * 配了内网基址就直连 Vectra 后端，否则走 uswoo.com 的反代。
 */
export async function publicApi<T>(event: H3Event, path: string): Promise<T> {
  const config = useRuntimeConfig(event);
  const serverBase = String(config.apiBaseServer || "");
  const publicBase = String(config.public.apiBase);
  // 本地开发时浏览器端基址是相对路径（经开发服务器转发），服务端不能用
  const base = (serverBase || (publicBase.startsWith("http") ? publicBase : "https://uswoo.com/api/uswoo/public")).replace(/\/$/, "");
  const headers: Record<string, string> = {};
  if (serverBase && config.apiHostHeader) headers.host = String(config.apiHostHeader);
  const response = await $fetch<{ status: string; data: T; message?: string }>(`${base}${path}`, { headers, timeout: 10000 });
  if (response?.status !== "success") throw createError({ statusCode: 502, statusMessage: response?.message || "Upstream error" });
  return response.data;
}
