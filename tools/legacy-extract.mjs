#!/usr/bin/env node
/**
 * 从 legacy/ 里的 Claude Design 导出页提取重构要用的原料。可重复执行，产物可随时重新生成。
 *
 *   node tools/legacy-extract.mjs
 *
 * 产物：
 *   app/generated/zh.json                 中文字典（英文原文 → 中文），来自 i18n-zh.js 与 i18n-zh-cities.js
 *   app/assets/css/pages/<slug>.css       每个页面的样式，全部限定在 .pg-<slug> 之下，页面之间互不干扰
 *   app/assets/css/chrome.css             语言切换、移动端菜单、返回顶部的样式（原先由脚本运行时注入）
 *   public/assets/slots/<id>.<ext>        设计工具里拖进图片槽位的图片（原先是 base64）
 *   legacy/_extracted/<slug>.{html,js}    各页面的模板与脚本原文，仅供移植时对照（不入库）
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const legacy = path.join(root, "legacy");
const out = (...parts) => {
  const file = path.join(root, ...parts);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return file;
};

/** 页面文件 → slug。slug 同时是样式作用域类名 .pg-<slug> 的后缀。 */
const PAGES = {
  "USWOO Home.dc.html": "home",
  "USWOO Services.dc.html": "services",
  "USWOO City Guides.dc.html": "city-guides",
  "USWOO Listings.dc.html": "listings",
  "USWOO Press & Stories.dc.html": "press",
  "USWOO Partners.dc.html": "partners",
  "USWOO About Us.dc.html": "about",
  "USWOO Contact.dc.html": "contact",
  "USWOO News - USWOO Goes National.dc.html": "news-national",
  "USWOO News - Real Estate Summit at NYU Stern.dc.html": "news-summit",
  "USWOO Story - Finding a Better Fit.dc.html": "story-better-fit",
  "USWOO Story - From Campus to First Apartment.dc.html": "story-campus",
  "USWOO Story - Moving Cities Made Easier.dc.html": "story-moving"
};

// ---------------------------------------------------------------------------
// 1. 中文字典
// ---------------------------------------------------------------------------
function extractDictionary() {
  const sandbox = { window: {}, matchMedia: () => ({ matches: false }) };
  sandbox.window.matchMedia = sandbox.matchMedia;
  vm.createContext(sandbox);
  for (const file of ["i18n-zh.js", "i18n-zh-cities.js"]) {
    vm.runInContext(fs.readFileSync(path.join(legacy, file), "utf8"), sandbox, { filename: file });
  }
  const norm = text => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
  const dict = {};
  for (const [key, value] of Object.entries(sandbox.window.USWOO_ZH ?? {})) {
    if (typeof value === "string") dict[norm(key)] = value;
  }
  fs.writeFileSync(out("app/generated/zh.json"), JSON.stringify(dict, null, 1) + "\n");
  return Object.keys(dict).length;
}

// ---------------------------------------------------------------------------
// 2. 图片槽位
// ---------------------------------------------------------------------------
function extractSlots() {
  const state = JSON.parse(fs.readFileSync(path.join(legacy, ".image-slots.state.json"), "utf8"));
  const manifest = {};
  for (const [id, entry] of Object.entries(state)) {
    const uri = typeof entry === "string" ? entry : entry.u;
    const match = /^data:image\/(\w+);base64,(.*)$/s.exec(uri ?? "");
    if (!match) continue;
    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    fs.writeFileSync(out("public/assets/slots", `${id}.${ext}`), Buffer.from(match[2], "base64"));
    manifest[id] = `/assets/slots/${id}.${ext}`;
  }
  fs.writeFileSync(out("app/generated/slots.json"), JSON.stringify(manifest, null, 1) + "\n");
  return Object.keys(manifest).length;
}

// ---------------------------------------------------------------------------
// 3. 样式作用域
// ---------------------------------------------------------------------------

/** 把 CSS 文本切成顶层语句：{ prelude, body }（有花括号）或 { statement }（如 @import）。 */
function splitRules(css) {
  const rules = [];
  let i = 0;
  const n = css.length;
  while (i < n) {
    while (i < n && /\s/.test(css[i])) i++;
    if (i >= n) break;
    if (css.startsWith("/*", i)) {
      const end = css.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    let j = i;
    let depthParen = 0;
    let quote = "";
    while (j < n) {
      const ch = css[j];
      if (quote) {
        if (ch === "\\") j++;
        else if (ch === quote) quote = "";
      } else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === "(") depthParen++;
      else if (ch === ")") depthParen--;
      else if (depthParen === 0 && (ch === "{" || ch === ";")) break;
      j++;
    }
    if (j >= n || css[j] === ";") {
      rules.push({ statement: css.slice(i, j).trim() });
      i = j + 1;
      continue;
    }
    const prelude = css.slice(i, j).trim();
    let depth = 1;
    let k = j + 1;
    quote = "";
    while (k < n && depth > 0) {
      const ch = css[k];
      if (quote) {
        if (ch === "\\") k++;
        else if (ch === quote) quote = "";
      } else if (ch === '"' || ch === "'") quote = ch;
      else if (css.startsWith("/*", k)) {
        const end = css.indexOf("*/", k + 2);
        k = end === -1 ? n : end + 1;
      } else if (ch === "{") depth++;
      else if (ch === "}") depth--;
      k++;
    }
    rules.push({ prelude, body: css.slice(j + 1, k - 1) });
    i = k;
  }
  return rules;
}

function splitSelectors(list) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of list) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * 给一个选择器加上页面作用域。
 * 原页面里写在 html / body / :root 上的规则改落到页面根元素上；
 * `html.xxx .foo`、`body.xxx .foo` 这类「全局状态类 + 后代」保留状态类，在其后插入作用域。
 */
/** 由脚本加在 <html> 上的状态类：选择器以它们开头时，保留状态类并在其后插入作用域 */
const ROOT_STATE_CLASSES = [".m-reveal"];

function scopeSelector(selector, scope) {
  // 原页面的 <image-slot> 自定义元素在重构后是 <div class="image-slot">
  let sel = selector.trim().replace(/(^|[\s>+~(])image-slot\b/g, "$1.image-slot");
  for (const state of ROOT_STATE_CLASSES) {
    if (sel === state) return `html${state} ${scope}`;
    if (sel.startsWith(`${state} `)) return `html${state} ${scope} ${sel.slice(state.length + 1)}`;
  }
  if (sel === ":root" || sel === "html" || sel === "body" || sel === "html, body") return scope;
  if (sel.startsWith(":root")) return scope + sel.slice(5);
  const lead = /^(html|body)((?:[.#:\[][^\s>+~]*)?)(\s+|\s*>\s*)?/.exec(sel);
  if (lead) {
    const [whole, tag, qualifier, combinator] = lead;
    let rest = sel.slice(whole.length);
    // `html body main h1` 这种连写：继续吃掉紧跟着的 body
    const second = /^body((?:[.#:\[][^\s>+~]*)?)(\s+|\s*>\s*)?/.exec(rest);
    let state = qualifier ? `${tag}${qualifier} ` : "";
    if (second && tag === "html") {
      if (second[1]) state += `body${second[1]} `;
      rest = rest.slice(second[0].length);
    }
    if (!combinator && !rest) return state ? `${state}${scope}` : scope;
    return `${state}${scope} ${rest}`.replace(/\s+/g, " ").trim();
  }
  return `${scope} ${sel}`;
}

function scopeCss(css, scope) {
  let outCss = "";
  for (const rule of splitRules(css)) {
    if (rule.statement !== undefined) {
      // 字体由 nuxt.config 统一加载；其余顶层语句照抄
      if (!/^@import\b/.test(rule.statement) && rule.statement) outCss += `${rule.statement};\n`;
      continue;
    }
    const { prelude, body } = rule;
    if (/^@(media|supports|layer|container)\b/.test(prelude)) {
      outCss += `${prelude}{\n${scopeCss(body, scope)}}\n`;
    } else if (prelude.startsWith("@")) {
      // @keyframes、@font-face 等不含需要限定的选择器
      outCss += `${prelude}{${body}}\n`;
    } else {
      const selectors = splitSelectors(prelude).map(sel => scopeSelector(sel, scope));
      outCss += `${[...new Set(selectors)].join(",\n")}{${body}}\n`;
    }
  }
  return outCss;
}

function extractPages() {
  const report = [];
  for (const [file, slug] of Object.entries(PAGES)) {
    const html = fs.readFileSync(path.join(legacy, file), "utf8");
    const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]).join("\n");
    const scoped = scopeCss(styles, `.pg-${slug}`);
    fs.writeFileSync(
      out("app/assets/css/pages", `${slug}.css`),
      `/* 由 tools/legacy-extract.mjs 从 legacy/${file} 生成，选择器已限定在 .pg-${slug} 之下。\n   需要改样式时改这里即可；重新运行提取脚本会覆盖本文件。 */\n${scoped}`
    );
    const body = html.slice(html.indexOf("</helmet>") + 9);
    const script = /<script[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(body);
    const template = body.slice(0, script ? script.index : body.indexOf("</x-dc>"));
    fs.writeFileSync(out("legacy/_extracted", `${slug}.html`), template.trim() + "\n");
    fs.writeFileSync(out("legacy/_extracted", `${slug}.js`), (script ? script[1] : "").trim() + "\n");
    report.push(`${slug}: css ${(scoped.length / 1024).toFixed(1)}KB, template ${(template.length / 1024).toFixed(1)}KB, script ${((script?.[1].length ?? 0) / 1024).toFixed(1)}KB`);
  }
  return report;
}

// ---------------------------------------------------------------------------
// 4. 原先由脚本注入的样式
// ---------------------------------------------------------------------------
function extractChromeCss() {
  const pick = (file, pattern) => {
    const source = fs.readFileSync(path.join(legacy, file), "utf8");
    const match = pattern.exec(source);
    if (!match) throw new Error(`找不到 ${file} 里的样式字符串`);
    return vm.runInNewContext(`(${match[1]})`);
  };
  const langToggle = pick("i18n.js", /var CSS = (\[[\s\S]*?\]\.join\(''\));/);
  const burger = pick("mobile-nav.js", /css\.textContent =\s*([\s\S]*?);\n\s*document\.head/);
  const backToTop = pick("back-to-top.js", /css\.textContent =\s*([\s\S]*?);\n\s*document\.head/);
  // 语言标记沿用原脚本的 html[data-lang]（app.vue 会在 <html> 上输出它）
  const css = [
    "/* 由 tools/legacy-extract.mjs 生成：原先由 i18n.js、mobile-nav.js、back-to-top.js 在运行时注入的样式。 */",
    langToggle,
    burger,
    backToTop
  ].join("\n");
  fs.writeFileSync(out("app/assets/css/chrome.css"), css.replace(/}/g, "}\n") + "\n");
  fs.copyFileSync(path.join(legacy, "mobile-type.css"), out("app/assets/css/mobile-type.css"));
}

console.log(`字典：${extractDictionary()} 条`);
console.log(`图片槽位：${extractSlots()} 张`);
for (const line of extractPages()) console.log(line);
extractChromeCss();
console.log("chrome.css、mobile-type.css 已生成");
