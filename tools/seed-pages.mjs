#!/usr/bin/env node
/**
 * 生成页面内容的种子：把代码里各页面的默认文案整理成 CMS「新官网页面」能直接编辑的内容。
 *
 *   先启动本地开发服务器（pnpm dev），再执行：
 *   node tools/seed-pages.mjs [http://localhost:3000]
 *
 * 做法：请求一遍各页面，页面渲染时会记下用到的每个字段及其默认值（中文取自设计稿的字典），
 * 再从开发服务器取回这份记录，按字段路径还原成嵌套结构，写到 seed/pages/<页面键>.json。
 * 导入只在 CMS 里还没有这个页面时写入，不会覆盖已经在 CMS 里改过的内容。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
/** 页面键 → 网址。只有后端支持在 CMS 里编辑的五个页面 */
const PAGES = { home: "/", services: "/services", contact: "/contact", about: "/about", partners: "/partners" };

for (const url of Object.values(PAGES)) {
  const response = await fetch(base + url);
  if (!response.ok) throw new Error(`${url} 返回 ${response.status}`);
  await response.text();
}
const defaults = await (await fetch(`${base}/_dev/page-defaults`)).json();

/** "help.cards.0.title" 这样的路径还原成嵌套结构；纯数字的一段是数组下标 */
function build(flat) {
  const rootNode = {};
  for (const [dotted, value] of Object.entries(flat)) {
    const keys = dotted.split(".");
    let node = rootNode;
    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        node[key] = value;
        return;
      }
      if (node[key] === undefined || typeof node[key] !== "object") node[key] = /^\d+$/.test(keys[index + 1]) ? [] : {};
      node = node[key];
    });
  }
  return rootNode;
}

fs.mkdirSync(path.join(root, "seed/pages"), { recursive: true });
for (const key of Object.keys(PAGES)) {
  const flat = defaults[key];
  if (!flat || !Object.keys(flat).length) throw new Error(`没有取到 ${key} 的字段，开发服务器是否在运行？`);
  const sorted = Object.fromEntries(Object.entries(flat).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })));
  fs.writeFileSync(path.join(root, "seed/pages", `${key}.json`), JSON.stringify({ key, payload: build(sorted) }, null, 2) + "\n");
  const missingZh = Object.values(flat).filter(value => value && typeof value === "object" && "en" in value && !value.zh).length;
  console.log(`${key}: ${Object.keys(flat).length} 个字段${missingZh ? `，其中 ${missingZh} 个没有中文` : ""}`);
}
