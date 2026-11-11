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
| `app/composables/` | `useApi` 请求、`usePageContent` 页面内容（只读 CMS）、`useSite` 全站通用内容、`useTx` 功能性界面文字、`useRegions` 地区、`usePageSeo` SEO |
| `app/assets/css/pages/<页面>.css` | 由设计稿生成的页面样式（`pnpm extract` 重新生成，不要手改）；手工补充写在同名的 `.extra.css` |
| `server/routes/` | `sitemap.xml`、`robots.txt`、缓存刷新入口 `/_site/revalidate` |
| `shared/types/api.ts` | 公开接口的返回类型 |
| `seed/` | 导入 CMS 的种子数据：文章、示例房源、City Guide |
| `tools/` | `legacy-extract.mjs` 从设计稿提取样式；`seed-guides.mjs` 生成 City Guide 种子 |
| `legacy/` | 重构前的静态页面（Claude Design 导出），仅作对照 |
| `deploy/nginx/` | 服务器上 Nginx 配置的脱敏记录 |

## 网址

- 英文无前缀，中文在 `/zh`。
- 全站一份：`/contact`。
- 分地区：`/{region}`（地区首页）、`/{region}/services`、`/{region}/city-guide`、`/{region}/listings`、`/{region}/press`、`/{region}/partners`、`/{region}/about`；
  不带地区的 `/`、`/services`、`/city-guides`、`/listings`、`/press`、`/partners`、`/about` 是全站页或汇总页。
- 详情：`/press/{slug}`、`/listings/{id}`。
- 地区：`new-york`（含新泽西）、`boston`、`chicago`、`los-angeles`、`washington-dc`、`philadelphia`。

## 内容从哪里来

代码里不保留任何默认内容，访客看到的一切都来自 CMS：

- **文章、房源、City Guide**：各自的内容表。
- **各页面的文案、图片、数字、SEO 标题与描述**：CMS「新官网页面」里的九个页面——首页、Services、About、Partners（这四个可按地区配置：地区只需写与全站默认不同的部分，每个区块可单独隐藏）、Contact，以及房源页文案、文章页文案、城市指南页文案、全站通用。
- **站点名称、favicon、logo、导航、页脚（订阅、社交链接、办公室、旗下平台、留学生网、二维码，各带展示开关）**：「全站通用」。
- **地区卡片的配图与顺序**：「新官网地区」。
- **SEO 标题、描述、关键词**：各页面自己的 `seo` 字段；文章与房源用各自的 SEO 字段。不读取旧官网的「SEO 设置」。

留在代码里的只有功能性的界面文字（表单校验与提交状态、加载状态、无障碍标签、单位与日期格式，中文在 `app/locales/ui/`）和 404/出错页（CMS 不可用时也要能显示）。
某个页面在 CMS 里没有发布、或接口取不到内容时，该页面返回 503，不渲染空壳。

`seed/` 是最初导入 CMS 的那份内容，留作记录与重建用；改内容请在 CMS 里改。

## 发布

改动通过 PR 合并到 `main` 后自动发布到测试站（new.uswoo.cn / new.uswoo.com），不需要任何服务器登录或密钥：

1. GitHub Actions「Deploy to staging」做类型检查与构建，把构建产物上传到仓库的 Release「staging」。
2. 测试站的服务器每分钟检查一次，发现新版本就下载、核对校验值，在备用端口上试启动通过后才替换正在运行的版本；起不来就保留旧版本。
3. 流程等到测试站确实切换到这次提交才算成功；失败时会打印服务器上的应用日志。

查看测试站当前运行的提交：

```bash
curl -s https://new.uswoo.com/_deploy/status.json
```

回退到之前的版本：

```bash
gh workflow run deploy-staging.yml -f ref=<提交号>
```

完整的发布步骤（含检查、提 PR、确认上线、失败处理）见 [`.claude/skills/deploy/SKILL.md`](.claude/skills/deploy/SKILL.md)；项目约定见 [`CLAUDE.md`](CLAUDE.md)。
服务器上的拉取脚本记录在 `deploy/staging/pull-release.sh`，它由运维手工安装，仓库里的改动不会自动生效。

正式站 uswoo.com 不在这套流程里，由负责人另外手动发布。
测试站整站 `noindex`；页面缓存 10 分钟，CMS 保存内容后由后端通知官网立即刷新。
