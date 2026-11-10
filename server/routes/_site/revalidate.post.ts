import { createHmac, timingSafeEqual } from "node:crypto";

/** 时间戳与本机时间相差超过这个范围的通知一律拒绝，防止重放 */
const MAX_SKEW_MS = 5 * 60 * 1000;

/**
 * CMS 保存内容后，后端向这里发通知，让页面缓存立即失效（否则要等缓存自然过期）。
 *
 * 请求体 {"tags": [...], "timestamp": 毫秒}，请求头 X-USWOO-Revalidate-Signature 是对原始请求体的 HMAC-SHA256。
 * 站点页面不多，这里不按标签逐页清除，而是收到任何有效通知就清空全部页面缓存：
 * 下一次访问重新渲染，逻辑简单、不会漏清（一篇文章会出现在首页、多个地区列表和推荐位里）。
 */
export default defineEventHandler(async event => {
  const secret = String(useRuntimeConfig(event).revalidateSecret || "");
  // 没配置密钥时这个入口不存在
  if (!secret) throw createError({ statusCode: 404 });

  const raw = (await readRawBody(event, "utf8")) ?? "";
  const given = Buffer.from(String(getHeader(event, "x-uswoo-revalidate-signature") || ""), "utf8");
  const expected = Buffer.from(createHmac("sha256", secret).update(raw).digest("hex"), "utf8");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw createError({ statusCode: 401, statusMessage: "Bad signature" });

  let body: { tags?: unknown; timestamp?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    throw createError({ statusCode: 400, statusMessage: "Bad body" });
  }
  const timestamp = Number(body.timestamp);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > MAX_SKEW_MS) throw createError({ statusCode: 400, statusMessage: "Stale timestamp" });
  const tags = Array.isArray(body.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string") : [];

  const storage = useStorage("cache");
  const keys = await storage.getKeys("nitro:routes");
  await Promise.all(keys.map(key => storage.removeItem(key)));
  return { ok: true, tags: tags.length, cleared: keys.length };
});
