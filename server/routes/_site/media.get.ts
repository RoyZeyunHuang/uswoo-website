/** 允许转发的媒体域名（CMS 媒体库的 CDN） */
const MEDIA_HOSTS = ["uswoo-app-oss.uswoo.cn"];
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * 同源转发媒体库里的图片，只给 City Guide 地图用：公司 logo 要先画到画布上再交给地图，
 * 而媒体库的 CDN 不带跨域响应头，直接加载的图片取不出像素。
 * 只转发白名单域名上的小图片，其余一律 404，不能被当成任意地址的代理。
 */
export default defineEventHandler(async event => {
  const raw = String(getQuery(event).url ?? "");
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    throw createError({ statusCode: 404 });
  }
  if (target.protocol !== "https:" || !MEDIA_HOSTS.includes(target.hostname)) throw createError({ statusCode: 404 });

  const response = await fetch(target, { redirect: "error", signal: AbortSignal.timeout(8000) }).catch(() => null);
  const type = response?.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!response?.ok || !IMAGE_TYPES.includes(type)) throw createError({ statusCode: 404 });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw createError({ statusCode: 404 });

  setHeader(event, "content-type", type);
  // 媒体库的文件名带内容哈希，同一个地址的内容不会变
  setHeader(event, "cache-control", "public, max-age=2592000, immutable");
  return bytes;
});
