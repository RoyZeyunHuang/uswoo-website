# USWOO 新官网 — 给 Claude 的项目说明

Nuxt 4 + Vue 3（SSR、TypeScript 严格模式、pnpm、Node 22）。这是**公开仓库**：不要提交服务器地址、内网地址、凭据、未公开的客户信息。

## 你在这个仓库里能做什么

- 改页面的版式、样式、交互（`app/`）。
- 通过 PR 合并到 `main`，自动发布到测试站。**发布步骤见 `.claude/skills/deploy/SKILL.md`，用户说"发布""部署"时按它做。**

不能做、也不要尝试：登录服务器、改接口或后端、发布正式站 uswoo.com（由负责人另外手动发布）。

## 最重要的一条规则：代码里不放内容

访客看到的所有文案、图片、数字、SEO 标题都来自 CMS（Vectra →「美窝房产CMS」），**代码里不允许写默认文案或默认图片**。

```ts
const { c, ch, img, raw, list } = await usePageContent("home"); // 页面键见下表
c("hero.sub")                 // 纯文字（按当前语言）
ch("hero.title")              // 给 v-html 用，只保留少量内联标记
img("hero.poster")            // 图片地址
raw<number>("stats.0.value")  // 数字、链接等
list("help.cards")            // 列表下标，配合 v-for
on("help")                    // 区块是否展示（CMS 里 help.show 不为 false）
```

- **每个区块都要能在 CMS 里隐藏**：页面上的每个 `<section>` 写成 `<section v-if="on('区块键')">`，区块键就是它在 CMS 内容里的顶层字段名。新增区块时照此处理，并保证区块不存在时页面脚本不报错。

- 全站通用内容（站点名称、logo、favicon、导航、页脚）用 `await useSite()`，用法相同。
- 需要新的文字或图片时：**先**在 CMS 对应页面里加字段并填好中英文，**再**发布读取它的代码。字段没填时页面上是空的，不会有兜底。
- 只有功能性的界面文字留在代码里：表单校验与提交状态、加载状态、无障碍标签、单位与日期格式。写法是 `tx("English")`，中文加到 `app/locales/ui/*.zh.ts`。拿不准算内容还是界面文字时，按内容处理，放进 CMS。
- `seed/` 是最初导入 CMS 的那份内容，仅作记录，改它不会改变网站。

| CMS 页面键 | 内容 |
|---|---|
| `home`、`services`、`about`、`partners` | 首页、Services、About、Partners。可按地区配置：`usePageContent("home", region)`，接口把该地区的内容盖在全站默认之上返回 |
| `contact` | Contact（全站一份） |
| `listings`、`press`、`city-guides` | 这三类页面上的固定文案（列表条目来自各自的内容表） |
| `site` | 全站通用：站点名称、logo、favicon、导航、页脚、默认分享图 |

## 其他约定

- **数据只读公开接口** `https://uswoo.com/api/uswoo/public/*`，用 `useApi()`；返回类型在 `shared/types/api.ts`，跟着后端的实际返回走，不要单方面修改。需要接口变化时让用户把需求提给后端同事。
- **路由**：英文无前缀，中文在 `/zh`。分地区的页面在 `app/pages/[region]/`（地区首页是 `/{region}`），与不带地区的页面共用 `app/components/views/` 里的同一个组件。地区列表来自 `useRegions()`，不要在代码里写死地区。
- **样式**：`app/assets/css/pages/<页面>.css` 由设计稿生成（`pnpm extract`），不要手改；补充样式写在同名的 `.extra.css`。所有选择器限定在 `.pg-<页面>` 之下。
- **SEO**：每个页面调用一次 `usePageSeo()`，标题、描述、关键词取自该页面在 CMS 里的 `seo` 字段。
- **服务端渲染**：内容必须在服务端输出；`window`、`document` 只在 `onMounted` 里用。页面输出不能包含访客相关的内容（整页会被缓存）。
- **注释**用简体中文，说明"为什么"。
- 提交前：`pnpm typecheck` 和 `pnpm build` 都要通过。

## 本地开发

```bash
pnpm install
```

```bash
pnpm dev
```

本地直接读线上的公开接口（只读），不需要任何凭证。联系表单在本地提交会真的写入一条标记为"测试"的咨询记录，测试时请写明是测试。

更多背景见 `README.md` 与 `docs/refactor-plan.md`。
