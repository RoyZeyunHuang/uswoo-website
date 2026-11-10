# USWOO 新官网

uswoo.com 的重构版：Nuxt 4 + Vue 3，服务端渲染，内容来自 Vectra「美窝房产CMS」的公开接口。
完整方案与实施进度见 [`docs/refactor-plan.md`](docs/refactor-plan.md)。

> 这是公开仓库：不要提交服务器地址、内网地址、凭据或部署路径。

## 本地开发

需要 Node 22 与 pnpm。

```bash
pnpm install
```

```bash
pnpm dev
```

本地直接读线上的公开接口（`https://uswoo.com/api/uswoo/public`，只读）。提交前跑一遍类型检查：

```bash
pnpm typecheck
```

## 目录

| 路径 | 内容 |
|---|---|
| `app/pages/` | 路由。不带地区的是全站页或汇总页，`[region]/` 下是各地区的页面 |
| `app/components/views/` | 地区页与汇总页共用的页面主体（About、Partners、Press、Listings、City Guide） |
| `app/components/detail/` | 文章、房源详情的版式（正式页与草稿预览页共用） |
| `app/composables/` | `useApi` 请求、`usePageContent` 页面内容（CMS 覆盖代码里的默认文案）、`useTx` 界面文案、`useRegions` 地区、`usePageSeo` SEO |
| `app/assets/css/pages/<页面>.css` | 由设计稿生成的页面样式（`pnpm extract` 重新生成，不要手改）；手工补充写在同名的 `.extra.css` |
| `server/routes/` | `sitemap.xml`、`robots.txt`、缓存刷新入口 `/_site/revalidate` |
| `shared/types/api.ts` | 公开接口的返回类型 |
| `seed/` | 导入 CMS 的种子数据：文章、示例房源、City Guide |
| `tools/` | `legacy-extract.mjs` 从设计稿提取样式与字典；`seed-guides.mjs` 生成 City Guide 种子；`deploy-staging.sh` 发布测试站 |
| `legacy/` | 重构前的静态页面（Claude Design 导出），仅作对照 |
| `deploy/nginx/` | 服务器上 Nginx 配置的脱敏记录 |

## 网址

- 英文无前缀，中文在 `/zh`。
- 全站一份：`/`、`/services`、`/contact`。
- 分地区：`/{region}/city-guide`、`/{region}/listings`、`/{region}/press`、`/{region}/partners`、`/{region}/about`；
  不带地区的 `/city-guides`、`/listings`、`/press`、`/partners`、`/about` 是汇总页。
- 详情：`/press/{slug}`、`/listings/{id}`。
- 地区：`new-york`（含新泽西）、`boston`、`chicago`、`los-angeles`、`washington-dc`、`philadelphia`。

## 内容从哪里来

- **文章、房源、City Guide** 全部来自 CMS。
- **首页、Services、Contact、About、Partners 的文案与图片**：代码里有一份默认内容（来自设计稿），CMS 里配置了哪个字段，哪个字段就以 CMS 为准。About、Partners 可以按地区单独配置，没配置的地区显示全站默认。
- **界面固定文案**（按钮、标签）在代码里，中文来自 `app/generated/zh.json`。
- **中文页的标题与描述**：全站页与汇总页沿用 CMS「SEO 设置」里的对应行。

## 发布

开发在 `refactor/nuxt-cms` 分支上进行，验收时发布到测试站。发布脚本从环境变量读取目标机器，不在仓库里写地址：

```bash
DEPLOY_JUMP=<跳板机> DEPLOY_HOST=<目标机器> DEPLOY_BASE=<测试站目录> tools/deploy-staging.sh
```

测试站整站 `noindex`；页面缓存 10 分钟，CMS 保存内容后由后端通知 `/_site/revalidate` 立即刷新（需要配置密钥，见方案文档）。
