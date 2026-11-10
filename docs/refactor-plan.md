# 新官网重构与 Vectra CMS 改造方案

状态：已按本文实施，测试站验收中　|　日期：2026-11-10

> 本仓库是公开仓库。本文不记录服务器地址、内网地址、凭据与部署路径，这些信息以 Vectra 前端仓库的规范文档为准。

## 实施进度（2026-11-10）

| 部分 | 状态 |
|---|---|
| uswoo.com 接口反代 `/api/uswoo/public/` | 已上线 |
| 测试站 `new.uswoo.cn`（HTTP 自动跳转 HTTPS、证书自动续期、应用容器） | 已上线 |
| Vectra 后端：10 张内容表、公开接口、管理接口、旧内容迁移、CMS 管理权限 | 已上线（后端仓库 `6e94a6b6`、`9cd9ef0d`） |
| Vectra 前端：新官网内容页面、迁移入口、CMS 管理权限 | 已推送 `main` 自动发布（前端仓库 `174e5127`、`f1af9207`） |
| 新官网 Nuxt 工程：全部页面、地区路由、SEO、站点地图、404、草稿预览、缓存刷新入口 | 已完成，发布在测试站（分支 `refactor/nuxt-cms`） |
| 种子数据：10 篇文章、6 套示例房源、5 个地区的 City Guide + 波士顿占位，图片进媒体库 | 已导入 CMS（后端脚本 `bin/uswoo_official_seed_import.php`，可重复执行） |
| 首页、Services、Contact、About、Partners 的文案 | 用代码里的默认内容（来自设计稿）；CMS 里配置了哪个字段就以 CMS 为准，没有批量导入 |
| SEO 设置里为新官网补 4 行（服务介绍、城市指南、合作伙伴、联系我们） | 未做：这张表属于现有官网的数据库，需要在 CMS「SEO 设置」里手工添加 |
| 后端运行环境配置刷新通知与预览密钥 | 未做，见下方第 9 条 |

**实施中相对本文原稿的调整**（以下各节中与此不一致的旧表述以这里为准）：

1. **不另起一套 CMS。** 新官网内容并入「美窝房产CMS」现有分组：内容 → 新官网文章、新官网页面；房源 → 新官网房源；地区 → 新官网地区、新官网城市指南；表单与线索 → 新官网咨询。没有单独的「新官网」菜单。
2. **站点基础设置与 SEO 沿用现有的。** 不建 `settings` 页面键，地区表没有 SEO 字段。公开接口 `GET /settings` 返回现有「站点设置」里的页脚、服务手册、用户协议；`GET /seo` 返回现有「SEO」里的行，按页面名称对应到新官网页面（首页、租房-认证房源→listings、地产资讯→press、关于我们→about；服务介绍、城市指南、合作伙伴、联系我们四行待补）。这两处保存后也会通知新官网刷新，标签为 `settings`、`seo`。
3. **管理接口前缀**是 `/uswoo-web/admin/official/*`（不是 `/uswoo-official/admin`）。
4. **权限按网站授予。** 超级管理员面板新增「CMS管理权限」，从“Vectra角色”里分出来，按网站（美窝官网、美窝新官网、留学生网小程序、Tea By The Sea官网）和分组勾选。新官网的权限键是 `uswoo_official_*`：全局管理员、六个地区、发布与下线、归档、旧内容迁移、咨询处理；美窝CMS全局管理员 `uswoo_web_admin` 同样拥有全部。已授予的权限原样保留。
5. **City Guide 点位的图片**存为点位行上的媒体编号列表，没有单独的关联表。
6. **页面与 City Guide 的内容**目前在 CMS 里以结构化 JSON 编辑（图片用 `mediaId` 引用媒体库）；等 Nuxt 页面定下各页面的结构后再换成表单。
7. **定时发布**靠公开接口按时间判断可见性，到点自动可见；到点主动通知官网刷新的计划任务尚未登记（列表页缓存 10 分钟内会自然更新）。
8. **正文图片**从媒体库插入，富文本编辑器在新官网文章里关闭了本地上传。媒体库的上传与浏览目前仍要求美窝官网的权限，只有新官网地区权限的人暂时看不到媒体库，需要后续放开。
9. **缓存刷新通知与预览**需要在后端运行环境配置 `USWOO_OFFICIAL_REVALIDATE_TARGETS`、`USWOO_OFFICIAL_PREVIEW_SECRET`，并在测试站环境文件里配置同一个 `NUXT_REVALIDATE_SECRET`；未配置时不发通知、预览不可用，内容更新最长 10 分钟后在官网可见。官网一侧的入口与预览页已经做好。
10. **页面缓存放在进程内存里**，不落盘（原稿写的是本地文件）。单实例够用，发布新版本时随容器重启清空，避免旧页面引用已不存在的静态文件。收到刷新通知时清空全部页面缓存，不按标签逐页清除。
11. **首页「Where We Operate」是六个地区**（加入波士顿），文案相应改为 six major U.S. markets。
12. **汇总页 `/city-guides`** 显示纽约的 City Guide，canonical 指向 `/new-york/city-guide`，不进站点地图；城市切换是到各地区网址的链接。
13. **中文页的标题与描述**：全站页与汇总页在 CMS「SEO 设置」有对应行时以它为准（那份设置只有中文）；英文页、地区页、文章与房源详情用页面自身的标题。
14. **导航里的地区**记在浏览器本地（不是 cookie），页面挂载后才读取，服务端输出不受影响。
15. **片区边界、商圈边界、地铁线路**作为站点静态文件发布（`/assets/guides/<地区>/`、`/assets/transit/`），没有上传 CDN；City Guide 内容里记的是它们的路径。
16. **文章的阅读时长**是整数分钟：三篇租客故事原稿写 1.5 分钟，导入后是 2 分钟。

## 0. 名词约定

| 名称 | 指代 |
|---|---|
| 新官网 | 本仓库 `uswoo-website`。现为静态站，本方案的重构对象 |
| 实验官网 | 仓库 `uswoo_website`。已是 Nuxt 4 + SSR，读 Vectra 的 `/mc/uswoo/*` |
| Vectra | 内部系统。前端仓库 `uswoo_portal`，后端 `portal_backend_v2` |
| 美窝房产CMS | Vectra 中的官网内容管理模块（后端模块名 `uswoo_web`） |
| 共用库 | 留学生网的业务库，实验官网、小程序、Java 后台共用 |
| 旧文章 | 共用库 `property_information` 表中的文章，现有 45 篇，全部属于纽约 |
| 旧房源 | 共用库 `lease_houses_manager`（租）与 `sell_houses_manager`（售）中的房源 |

## 1. 已确认的决定

| 事项 | 决定 |
|---|---|
| 框架 | Vue 3 + Nuxt，SSR |
| 公开接口前缀 | `/api/uswoo/public/*` |
| 接口域名 | 所有环境始终用 `uswoo.com`，由 uswoo.com 做反向代理 |
| 正式域名 | `uswoo.com` 裸域 |
| 测试部署 | `new.uswoo.cn`，部署在 uswoo.com 所在的机器上；重构分支的开发直接发布到这里 |
| 生产部署 | 同一台机器，测试通过后切换 uswoo.com 的 Nginx 配置指向新官网 |
| Vercel | 重构期间不在 Vercel 部署；`main` 分支的静态站保持现状 |
| 反向代理 | 在 uswoo.com 所在机器的 Nginx 上配置，经内网转发到 Vectra 后端 |
| 发布授权 | Vectra 后端按后端部署规范直接上生产（含建表）；Vectra 前端推送 `main` 触发自动发布 |
| 旧网址 | 不做 301 |
| 文章 | 新官网 Press & Stories 与旧文章分开存放，提供旧文章迁移功能 |
| 房源 | 新官网房源单独存放，提供旧房源迁移功能；现有 6 条示例房源录入数据库 |
| 地区 | 纽约（含新泽西）、波士顿、芝加哥、洛杉矶、华盛顿特区、费城；康州不上 |
| 全站一致的页面 | 首页、Services |
| 可按地区不同的页面 | City Guides、Listings、文章、Partners、About Us |
| City Guide 数据 | 纽约、芝加哥、洛杉矶、华盛顿特区、费城导入现有真实数据；波士顿没有现成数据，暂时复制纽约占位（在数据库中复制） |

## 2. 现状

### 2.1 新官网

- 13 个 Claude Design 导出的 `.dc.html`，浏览器端加载 React 后渲染，无构建步骤。
- 内容全部写死在 HTML 与内联脚本里；中文由 `i18n.js` 在运行时按英文原文查字典替换。
- 搜索引擎抓到的 HTML 没有正文，也没有独立的中文网址。
- 图片：`.image-slots.state.json` 2.4MB（base64），`assets/` 42MB。
- 部署在 Vercel。Vercel 校验提交作者，靠 GitHub Action 补空提交放行。
- 市场同事直接改 HTML 推送发布，频率很高。

### 2.2 实验官网（可复用的部分）

- Nuxt 4.6、`@nuxtjs/i18n`、`@nuxtjs/sitemap`、`@nuxtjs/robots`、`nuxt-schema-org`、Pinia、Tailwind 4。
- 可复用：双语/媒体/分页类型定义、Vectra 请求封装（统一响应信封）、OSS 图片组件与缩放工具、SEO 组合函数、站点地图数据源写法、HTML 清洗配置。
- 不照搬：Java 适配层；缓存刷新接口（忽略标签整库清空、清不到页面缓存、缓存在内存里多实例不同步）；靠 cookie 决定首页地区（导致首页不能缓存）。

### 2.3 Vectra 后端（生产只读核对）

- 公开只读接口 `/mc/uswoo/*`，匿名，统一信封 `{status, data, message, code, error_key}`，GET 带 `Cache-Control: public, max-age=30, stale-while-revalidate=120`。
- 管理接口三套：
  - `/uswoo-web/admin/shared/{resource}`：共用库的表（文章、房源、楼盘、城市等）。
  - `/uswoo-web/admin/cms/{resource}`：通用资源注册表，字段、筛选、状态流转、地区范围均由能力描述驱动。
  - `/uswoo-web/admin/{module}/{key}`：Vectra 自有内容表 `uswoo_web_content`，带历史版本与恢复。
- 已有能力：乐观锁（`updatedAt`）、历史版本、操作审计、媒体库 `uswoo_web_media`（OSS + CDN，含中英文 alt）、写入幂等键。
- 权限：`UswooWebPermissionMatrix`，范围角色（全局、纽约、波士顿、康州）加动作角色（内容读写、状态、删除、媒体、导出等）。
- 城市：共用库 `city_manager` 只启用纽约(22)、波士顿(23)。芝加哥、洛杉矶、华盛顿、费城不存在。

**核对中发现的现有缺陷（本次一并修）**

| 位置 | 问题 | 影响 |
|---|---|---|
| `UswooWebRevalidateGateway` | 签名请求头用了关联数组写法，实际发不出正确的头；状态码在请求执行前读取，恒为 0 | 官网缓存刷新通知实际不生效，且每次都记一条失败日志 |
| 富文本编辑器 | 正文插图地址是 Vectra 自己的文件接口（`/backend_v2/get-file`），不是媒体库 CDN | 官网正文图片依赖 Vectra 域名和登录态 |

### 2.4 uswoo.com 所在机器（只读核对）

| 项 | 现状 | 对方案的影响 |
|---|---|---|
| 系统 | CentOS 7，4 核 8G，磁盘余量充足 | 系统库过旧，新版 Node 无法直接安装 |
| Node | 宿主机为 16 | Nuxt 4 需要 Node 22，新官网用 Docker 容器运行 |
| Docker | 已安装，当前没有运行中的容器 | 可直接使用 |
| Nginx | 1.20，站点配置在 `conf.d/` 下，一个站点一个文件；配置目录不在版本管理中 | 新增站点文件即可；改动前手工备份 |
| uswoo.com | Nginx 转发到本机的现有官网进程 | 生产切换只需改这一处转发目标 |
| 移动端跳转 | uswoo.com 站点级规则：移动设备访问任何路径都跳到 `m.uswoo.com` | 接口路径必须排除在外，否则手机浏览器请求接口会被跳走 |
| `/vectraapi/` | 已有一段到 Vectra 的反代，走公网 HTTPS | 有先例可参照；新接口改走内网 |
| 到 Vectra 的内网 | 连通，公开接口响应约 16 毫秒 | 反代与服务端渲染都走内网 |
| `/api/uswoo/public/` | 没有专门的处理，目前落到现有官网的兜底页面 | 路径可用 |
| 证书 | 已装 certbot，其他站点有验证路径的写法 | `new.uswoo.cn` 的证书可在本机签发 |
| uk.uswoo.com | 与本项目无关的既有问题：证书已于 2026-03-27 过期，且后端进程未运行（返回 502）。本次未做处理 | 你方知情 |

### 2.5 Vectra 前端

- 菜单由 `src/features/cms-kit/catalog.ts` 一份目录生成；页面按后端能力描述渲染，按钮权限全部来自后端。
- 已有站点切换（美国站/英国站），后端资源描述里有 `site` 与 `variantOf` 字段。
- 约束：五种语言文案（繁体须手写）、契约测试、前后端各写 ChangeLog、不得运行构建与开发服务器命令。

## 3. 总体架构

```
                 uswoo.com 所在机器
          ┌──────────────────────────────────────────────┐
浏览器 ──►│ Nginx                                        │
          │  ├─ uswoo.com/api/uswoo/public/* ──内网──────┼──► Vectra 后端公开接口
          │  ├─ new.uswoo.cn ──► 新官网容器（测试）       │         ▲
          │  └─ uswoo.com ─────► 现有官网（切换后改为新官网）│         │
          │                                              │         │
          │  新官网容器：服务端渲染时经内网直连 Vectra ────┼─────────┘
          └──────────────────────────────────────────────┘
                         ▲
                         │ 内容保存后按标签通知刷新缓存
          Vectra 后端 ◄── 管理接口 ◄── 美窝房产CMS「新官网」菜单
```

要点：

1. **新官网内容存 Vectra 自有的新表**，不进共用库。新官网、实验官网、小程序互不影响。
2. **新官网不设读请求的转发层**。浏览器端请求 `https://uswoo.com/api/uswoo/public/*`；服务端渲染与 Vectra 在同一内网，直连后端的同一组接口。字段整形在后端完成。
3. **Nuxt 自己的服务端路由不使用 `/api/` 前缀**，统一放在 `/_site/*`，避免与反代路径冲突。
4. **测试站与正式站读的是同一份生产数据**（接口域名固定）。两者的差别只在前端代码版本，以及是否允许收录。
5. **测试与生产在同一台机器上**。上线不是迁移部署，而是把 uswoo.com 的 Nginx 转发目标从现有官网换成新官网。

## 4. 新官网重构

### 4.1 技术栈

| 项 | 选择 | 说明 |
|---|---|---|
| 框架 | Nuxt 4、Vue 3.5、TypeScript 严格模式 | 与实验官网一致，便于复用代码 |
| 状态 | Pinia | 仅用于地区记忆、语言等少量客户端状态 |
| 多语言 | `@nuxtjs/i18n` | 英文默认无前缀，中文 `/zh` |
| SEO | `@nuxtjs/sitemap`、`@nuxtjs/robots`、`nuxt-schema-org` | |
| 样式 | 沿用设计稿的 CSS 变量与类名，抽成全局样式 + 组件样式 | 不引入新的 UI 库，保证还原度 |
| 地图 | MapLibre GL，仅客户端懒加载 | City Guides 使用 |
| 包管理 | pnpm，Node 22 | |

### 4.2 目录结构

```
app/
  pages/            路由页面
  components/       导航、页脚、卡片、区块组件
  composables/      useApi、useRegion、usePageSeo、useBi
  layouts/default.vue
  assets/css/       设计变量、排版、移动端字号层级
i18n/locales/       en.json、zh.json（界面文案）
server/routes/_site/  revalidate、preview、sitemap 数据源、健康检查
shared/types/       接口类型（与后端契约一一对应）
public/             字体、图标、robots 兜底
seed/               现有静态内容导出的种子数据（供后端导入）
legacy/             现有 .dc.html 及脚本，切换完成后删除
```

### 4.3 路由

地区写进 URL，不用 cookie 决定内容，页面才能被缓存和收录。

| 页面 | 英文路径 | 数据 |
|---|---|---|
| 首页 | `/` | `pages/home`（全站） |
| Services | `/services` | `pages/services`（全站） |
| Contact | `/contact` | `pages/contact`（全站）+ 表单 |
| City Guide | `/{region}/city-guide` | `guides/{region}` |
| Listings 列表 | `/{region}/listings` | `listings?region=` |
| 房源详情 | `/listings/{id}` | `listings/{id}` |
| Press & Stories 列表 | `/{region}/press` | `posts?region=` |
| 文章详情 | `/press/{slug}` | `posts/{slug}` |
| Partners | `/{region}/partners` | `pages/partners?region=` |
| About Us | `/{region}/about` | `pages/about?region=` |

- `region` 取值：`new-york`、`boston`、`chicago`、`los-angeles`、`washington-dc`、`philadelphia`。`new-york` 的显示名为 “New York & New Jersey”。
- 不带地区的 `/city-guides`、`/listings`、`/press`、`/partners`、`/about` 是全地区汇总页，可被收录；导航链接优先带上访客上次选择的地区（存 cookie，仅用于生成链接）。
- 文章与房源详情不带地区前缀，一篇内容只有一个网址。
- 中文：以上所有路径加 `/zh` 前缀。
- `region` 不合法时返回真实的 404。

- 旧的 `.dc.html` 网址与 `?lang=zh`、`?city=` 参数不做 301 跳转。
- uswoo.com 现有官网的网址同样不做 301，切换后失效的路径返回 404。

### 4.4 页面与数据来源

| 页面 | 来自 CMS | 留在代码里 |
|---|---|---|
| 首页 | Hero 文案与视频、How We Help 三卡、数字统计、CTA；精选房源取 `listings?featured=1` | 版式、动效、地区卡片布局 |
| Services | 流程步骤、入住清单、引语 | 滚动交互 |
| City Guide | 导语、片区卡片、结语、学校/商圈/地标点位 | 地图样式、筛选交互；片区边界与地铁线路为 CDN 静态文件 |
| Listings | 全部来自 CMS | 筛选与空状态 |
| Press & Stories | 全部来自 CMS | 三个分区的版式 |
| Partners | 标题、三步说明、Why USWOO、业绩数字、合作方 logo | 版式 |
| About Us | Hero、使命三条、故事、时间线 | 版式 |
| 页脚、导航、社交链接、合规声明 | `settings` | 结构 |

界面上固定不变的短文案（按钮、标签、表单提示）放 `i18n/locales`，不进 CMS。

### 4.5 多语言

- 英文为默认语言，中文在 `/zh`，不做浏览器语言自动跳转。
- CMS 内容字段统一为 `{ en, zh }`；中文缺失时回退英文，并在该页输出 `noindex`（避免中文网址出现整页英文的重复内容）。
- 现有 `i18n-zh.js`、`i18n-zh-cities.js` 两份字典拆分：界面短文案进语言文件，正文内容进种子数据的 `zh` 字段。

### 4.6 请求层

统一封装 `useApi()`：

- 浏览器端基址：`NUXT_PUBLIC_API_BASE`，固定为 `https://uswoo.com/api/uswoo/public`。
- 服务端基址：`NUXT_API_BASE_SERVER`，指向 Vectra 后端的内网地址（同一组接口）。未设置时回退到浏览器端基址。
- 解析统一信封，失败时抛出带 `error_key` 的错误；404 转为页面 404。
- 本地开发：反代上线后直接用 `https://uswoo.com/api/uswoo/public`；上线前用仓库内的模拟接口（数据来自 `seed/`）。

### 4.7 渲染与缓存

| 路径 | 策略 |
|---|---|
| `/`、`/services`、`/contact` | SSR + 缓存 1 小时，后台再生成 |
| 地区页（city-guide、partners、about） | SSR + 缓存 1 小时 |
| 列表页（listings、press） | SSR + 缓存 10 分钟 |
| 详情页 | SSR + 缓存 10 分钟 |
| `/_site/preview/**` | 不缓存，`noindex` |

- 缓存时长只是兜底，内容更新靠后端通知按标签刷新（见 4.9）。
- 页面输出中不含任何访客相关内容，保证整页可缓存。

### 4.8 部署环境

| | 测试 `new.uswoo.cn` | 生产 `uswoo.com` |
|---|---|---|
| 所在机器 | uswoo.com 所在机器 | 同一台 |
| 运行方式 | Docker 容器（Node 22），Nitro `node-server` 预设，只监听本机回环地址 | 同左，独立容器与端口 |
| Nginx | 新增站点文件，转发到测试容器 | 修改现有 uswoo.com 站点文件的转发目标 |
| 页面缓存 | Nitro 缓存，存储用挂载目录中的本地文件 | 同左 |
| 浏览器端接口 | `https://uswoo.com/api/uswoo/public`（跨域） | 同左（同源） |
| 服务端接口 | Vectra 内网地址 | 同左 |
| 收录 | 全站 `noindex`，`robots.txt` 全部禁止 | 允许 |
| canonical | 始终指向 `https://uswoo.com/...` | 同左 |
| 表单提交 | 标记为测试来源 | 正式 |
| 代码来源 | `refactor/nuxt-cms` 分支，每次需要验收时发布 | 测试通过的同一个构建产物 |

- **Vercel**：重构期间不使用。`main` 分支的静态站继续在 Vercel 上按现有方式发布，直到 uswoo.com 切换完成。代码仍保持平台无关（平台差异只在 Nitro 预设和缓存清除函数两处），以后需要时可以再接。
- **缓存存储**：单实例运行，用本地文件即可。机器上已有的 Redis 属于现有 Java 服务，新官网不使用它。
- **环境变量**（放在机器上的环境文件里，不进仓库）：

| 变量 | 作用 |
|---|---|
| `NUXT_PUBLIC_SITE_URL` | 固定为 `https://uswoo.com`，用于 canonical、站点地图、结构化数据 |
| `NUXT_PUBLIC_API_BASE` | 浏览器端接口基址 |
| `NUXT_API_BASE_SERVER` | 服务端接口基址（内网） |
| `NUXT_PUBLIC_DEPLOY_ENV` | `staging` / `production`，决定是否收录、表单是否标记测试 |
| `NUXT_REVALIDATE_SECRET` | 校验后端刷新通知的签名，测试与生产各一个 |
| `NUXT_PREVIEW_SECRET` | 校验预览链接 |

### 4.9 缓存刷新

- 新官网提供 `POST /_site/revalidate`，请求体 `{ tags: string[], timestamp }`，请求头带对**原始请求体**的 HMAC-SHA256 签名，时间戳 5 分钟内有效。
- 标签到路径的映射在新官网内维护：

| 标签 | 刷新的路径 |
|---|---|
| `post:{slug}` | `/press/{slug}`（含 `/zh`） |
| `posts:{region}` | `/{region}/press`、`/press`、`/` |
| `listing:{id}` | `/listings/{id}` |
| `listings:{region}` | `/{region}/listings`、`/listings`、`/` |
| `page:{key}:{region\|global}` | 对应页面；全站默认变更时刷新所有回退到默认的地区页 |
| `guide:{region}` | `/{region}/city-guide`、`/city-guides` |
| `regions`、`settings` | 全站 |

- 后端向所有已登记的部署（测试站、正式站）逐个发送，互不影响，失败只记日志并重试一次。
- 清除方式：按路径删除 Nitro 缓存中对应的条目。

### 4.10 SEO

- 每页独立的 `title`、`description`、canonical、Open Graph、Twitter 卡片；文章、房源、地区页的 SEO 字段来自 CMS，缺省时由标题和摘要生成。
- hreflang：`en`、`zh`、`x-default`（指向英文）。
- 结构化数据：

| 页面 | 类型 |
|---|---|
| 全站 | `Organization`、`WebSite` |
| 地区页 | `RealEstateAgent`（含服务区域） |
| 文章 | `NewsArticle` 或 `Article` |
| 房源 | `RealEstateListing` + `Offer` |
| 所有内页 | `BreadcrumbList` |

- 站点地图：静态页、六个地区 × 五类地区页、全部已发布文章与房源，含中英文对应关系；数据来自后端 `sitemap` 接口。
- 以下情况输出 `noindex` 且不进站点地图：占位内容（见 6.4）、示例房源、中文缺失的中文页、预览页、非生产环境。
- 性能：图片全部走 CDN 并按尺寸输出，首屏图预加载；字体自托管；首页视频延后加载并保留海报图；地图脚本只在 City Guide 页按需加载。
- 外部媒体报道（如 QNS、Commercial Observer）只在列表中外链，不生成站内详情页。

### 4.11 表单

- Contact 页由 `mailto:` 改为提交到 `POST /api/uswoo/public/leads`。
- 字段：姓名、邮箱、留言、类型（找房/合作/媒体）、地区（可选）、来源页面。
- 防滥用：蜜罐字段、提交间隔校验、后端按 IP 限流。
- 提交成功后在页面内提示；后端通知对应地区的负责人（见 5.6）。

## 5. Vectra 后端新增

新建独立模块 `official_site`（控制器、服务、仓储、领域规则各一层），与现有 `uswoo_web` 模块并列，复用其媒体库、审计、幂等、错误键机制。

### 5.1 数据表

全部建在 Vectra 自有库，前缀 `uswoo_official_`。通用列：`created_at`、`updated_at`（乐观锁）、`updated_by`、`updated_by_name`、`deleted_at`（可恢复归档）。

**`uswoo_official_region`　地区**

| 列 | 说明 |
|---|---|
| `id` | 主键 |
| `slug` | 唯一，如 `new-york` |
| `name_en`、`name_zh` | 显示名 |
| `short_code` | `NYC`、`BOS`、`CHI`、`LA`、`DC`、`PHL` |
| `emoji`、`cover_media_id` | 首页地区卡片用 |
| `legacy_city_id` | 可空。纽约→22、波士顿→23，仅用于迁移时筛选旧数据 |
| `sort`、`is_online` | |
| `seo_title_*`、`seo_description_*` | 中英文 |

初始六行。地区单独建表而不往共用库 `city_manager` 加行，是因为那张表被小程序和实验官网共用，新增城市会直接出现在它们的城市列表里。

**`uswoo_official_post`　Press & Stories**

| 列 | 说明 |
|---|---|
| `id` | 主键 |
| `type` | `press`（媒体与公告）、`story`（租客故事）、`moment`（品牌动态） |
| `slug` | 唯一，小写连字符 |
| `title_en`、`title_zh` | |
| `summary_en`、`summary_zh` | |
| `body_en`、`body_zh` | 清洗后的 HTML |
| `cover_media_id` | 媒体库 |
| `source_name`、`external_url` | 外部媒体报道用；有 `external_url` 时不生成详情页 |
| `author` | |
| `read_minutes` | 可空，空则按字数估算 |
| `published_at` | 展示用发布时间 |
| `status` | `draft`、`scheduled`、`published`、`archived` |
| `publish_at` | 定时发布时间 |
| `is_featured`、`sort` | 置顶与排序 |
| `is_national` | 为真时出现在所有地区列表 |
| `seo_title_*`、`seo_description_*`、`og_media_id` | |
| `legacy_article_id` | 可空，唯一。迁移来源的旧文章 id |

**`uswoo_official_post_region`**：`post_id`、`region_id`，联合主键。一篇文章可属于多个地区。

**`uswoo_official_listing`　房源**

| 列 | 说明 |
|---|---|
| `id` | 主键 |
| `region_id` | |
| `kind` | `rental`、`sale` |
| `title_en`、`title_zh` | |
| `neighborhood_en`、`neighborhood_zh` | 如 “Midtown, Manhattan” |
| `address` | 可空，是否对外展示由 `show_address` 控制 |
| `price`、`price_unit` | 数值与单位（`month`） |
| `bedrooms`、`bathrooms`、`sqft` | `bedrooms = 0` 表示 Studio |
| `available_from` | |
| `description_en`、`description_zh` | |
| `cover_media_id` | |
| `tag` | 默认 `Exclusive` |
| `status` | `draft`、`published`、`leased`、`archived` |
| `is_featured`、`sort` | 首页精选 |
| `is_sample` | 示例数据标记，为真时 `noindex` |
| `legacy_kind`、`legacy_id` | 可空，联合唯一。迁移来源的旧房源 |
| `building_ref` | 可空，共用库楼盘 id，仅作引用 |

**`uswoo_official_listing_media`**：`listing_id`、`media_id`、`sort`。

**`uswoo_official_page`　结构化页面内容**

| 列 | 说明 |
|---|---|
| `page_key` | `home`、`services`、`contact`、`about`、`partners`、`settings` |
| `region_id` | 可空。空表示全站默认 |
| `payload_json` | 按 `page_key` 校验结构 |
| `is_online` | |

唯一键 `(page_key, region_id)`。`home`、`services`、`contact`、`settings` 只允许全站一行；`about`、`partners` 可以有地区行，没有地区行时回退到全站默认。

**`uswoo_official_guide`　City Guide 主体**

| 列 | 说明 |
|---|---|
| `region_id` | 唯一 |
| `payload_json` | 导语、片区卡片（图标、名称、标签、长短两版说明、配图）、结语、地图中心与缩放、片区边界与地铁线路文件的 CDN 地址 |
| `is_placeholder` | 占位标记 |
| `copied_from_region_id` | 占位数据的来源地区 |
| `is_online` | |

**`uswoo_official_guide_place`　City Guide 点位**

| 列 | 说明 |
|---|---|
| `region_id` | |
| `kind` | `neighborhood`、`school`、`business`、`landmark`、`company`、`commute` |
| `name_en`、`name_zh`、`desc_en`、`desc_zh` | |
| `lat`、`lng`、`address` | |
| `area_en`、`area_zh` | 所属片区 |
| `logo_media_id` | 学校与公司 logo |
| `extra_json` | 行业分类、图标、图片署名等 |
| `sort`、`is_online` | |

**`uswoo_official_guide_place_media`**：`place_id`、`media_id`、`sort`。

**`uswoo_official_lead`　咨询表单**

`name`、`email`、`message`、`type`、`region_id`、`source_path`、`source_env`、`ip_hash`、`status`（`new`、`handled`、`spam`）、`handled_by`、`remark`。不复用共用库的线索表，那张表的语义是卖房委托。

**`uswoo_official_history`　历史版本**

`entity`、`entity_id`、`snapshot_json`、`operation`、`operator`、`created_at`。文章、房源、页面、City Guide 每次保存前写入，支持查看与恢复。

**迁移脚本**：每张表一份 `migrations/*.sql` 与对应回滚脚本，写明前置检查与应用后验证；执行前需人工确认。

### 5.2 公开接口

基址 `/api/uswoo/public`。后端内部路由注册为 `/uswoo/public/*`，uswoo.com 的反代做纯前缀转发。全部匿名，沿用统一信封。

| 方法与路径 | 参数 | 返回 |
|---|---|---|
| `GET /regions` | — | 已上线的地区列表 |
| `GET /settings` | — | 导航、页脚、社交链接、合规声明、默认 SEO |
| `GET /pages/{pageKey}` | `region?` | 页面内容；带 `resolvedFrom`（`region` 或 `global`） |
| `GET /posts` | `region?`、`type?`、`featured?`、`page`、`pageSize` | 分页列表，不含正文 |
| `GET /posts/{slug}` | — | 详情 + 同类型推荐三篇 |
| `GET /listings` | `region?`、`kind?`、`featured?`、`page`、`pageSize` | 分页列表 |
| `GET /listings/{id}` | — | 详情 |
| `GET /guides/{region}` | — | City Guide 主体 + 点位；带 `isPlaceholder` |
| `GET /sitemap` | — | 所有可收录内容的路径与更新时间 |
| `GET /preview/{entity}/{id}` | `token` | 草稿内容，`Cache-Control: no-store` |
| `POST /leads` | 见 4.11 | 提交结果 |

约定：

- 双语字段统一为 `{ "en": "...", "zh": "..." }`；媒体统一为 `{ "url", "width", "height", "alt": {en, zh} }`；分页统一为 `{ list, total, page, pageSize }`。
- 只返回 `published` 且到达发布时间的内容；`scheduled` 到点后自动可见，无需额外任务（查询条件里比较时间），另有定时任务到点发送刷新通知。
- GET 输出 `Cache-Control: public, max-age=60, stale-while-revalidate=300` 与 `ETag`。
- 跨域：正式站与接口同源，无需处理；测试站 `new.uswoo.cn` 是跨域访问，需要允许这一个来源。跨域响应头在 uswoo.com 的反代上对 `/api/uswoo/public/` 统一输出，PHP 不添加。
- `POST /leads`：按 IP 限流，校验蜜罐与提交间隔，写入 `source_env`。
- 新官网类型定义 `shared/types` 与本节一一对应，后端提供契约测试。

### 5.3 管理接口

基址 `/uswoo-web/admin/official`，需登录。能力描述沿用通用 CMS 资源的契约（`fields`、`fieldRules`、`filters`、`scope`、`transitions`、`writeReady` 等），前端可复用现有的通用资源页面。

| 资源 | 路径 | 特有动作 |
|---|---|---|
| 能力描述 | `GET /capabilities` | 返回各资源能力与当前用户可管理的地区 |
| 地区 | `/regions` | 上下线、排序 |
| 文章 | `/posts` | `publish`、`schedule`、`unpublish`、`archive`；`POST /posts/import-legacy` |
| 房源 | `/listings` | `publish`、`mark-leased`、`archive`；`POST /listings/import-legacy` |
| 页面 | `/pages/{pageKey}` | 按地区读取与保存；`POST /pages/{pageKey}/reset-to-global` |
| City Guide | `/guides/{regionId}`、`/guides/{regionId}/places` | `POST /guides/{regionId}/copy-from` |
| 咨询 | `/leads` | 标记已处理、标记垃圾、导出 |
| 历史 | `GET /{entity}/{id}/history`、`POST .../restore` | |
| 预览 | `POST /{entity}/{id}/preview-link` | 返回带签名、限时的预览地址 |

所有写入：校验 `updatedAt` 乐观锁、要求幂等键、写审计日志、写历史、发刷新通知。

### 5.4 旧文章迁移

接口：`POST /uswoo-web/admin/official/posts/import-legacy`

```
{ "articleIds": [84, 85], "type": "story", "regionIds": [1], "dryRun": false }
```

规则：

- **复制，不移动。** 旧文章在共用库中原样保留，实验官网和小程序不受影响。
- `legacy_article_id` 唯一，重复迁移同一篇时返回已存在的新文章，不产生第二份。
- 新文章一律为草稿，由编辑检查后发布。
- `dryRun` 只返回将要生成的结果与问题清单，不写库。

字段映射：

| 旧（`property_information`） | 新（`uswoo_official_post`） |
|---|---|
| `title`、`title_en` | `title_zh`、`title_en` |
| `introduction`、`introduction_en` | `summary_zh`、`summary_en` |
| `content`、`content_en` | `body_zh`、`body_en`（清洗后） |
| `cover_url` | 转存媒体库后写 `cover_media_id` |
| `add_time` | `published_at` |
| `city_id` | 默认勾选对应地区（22→纽约，23→波士顿），可在迁移时改 |
| `writer`、`publisher` | `author`（`publisher` 为空时取 `writer`） |
| `seo_title`、`seo_description` | `seo_title_zh`、`seo_description_zh` |
| `seo_url` 或英文标题 | 生成 `slug`，冲突时追加序号 |
| `information_type` | 不迁移，迁移时由操作人选 `type` |

正文处理：

1. 清洗 HTML：只保留标题、段落、列表、引用、链接、图片、表格、加粗斜体；去掉内联样式、脚本、微信排版留下的多层嵌套容器。
2. 正文与封面图片转存到媒体库，替换为 CDN 地址；转存失败的图片列入问题清单，不中断整篇。
3. 英文标题或正文缺失时照常迁移，在问题清单中标出，由编辑补全后才能发布英文页。

### 5.5 旧房源迁移与示例房源

接口：`POST /uswoo-web/admin/official/listings/import-legacy`

```
{ "kind": "rental", "ids": [6181], "regionId": 1, "dryRun": false }
```

规则与文章一致：复制不移动、`(legacy_kind, legacy_id)` 唯一、生成草稿、支持试运行。

| 旧（`lease_houses_manager` / `sell_houses_manager`） | 新 |
|---|---|
| `title`、`title_en` | `title_zh`、`title_en` |
| `prices` | `price`（租房单位 `month`） |
| `address`、`address_en` | `address` |
| 片区（`area`，形如 “English~中文”） | 拆成 `neighborhood_en`、`neighborhood_zh` |
| 卧室、卫生间、面积 | `bedrooms`、`bathrooms`、`sqft`（旧数据多为空，需人工补） |
| 可入住时间 | `available_from` |
| 图片 | 转存媒体库后写入封面与图集 |
| 楼盘 id | `building_ref` |
| 联系方式、内部备注 | **不迁移** |

说明：旧房源现有六千多条，多为数年前的个人转租。迁移入口按条或按批勾选，不提供“全部迁移”。

**示例房源**：现有页面上的 6 条示例作为种子数据录入，`is_sample = 1`、`status = published`。

| 标题 | 地区 | 片区 | 价格 | 户型 |
|---|---|---|---|---|
| Sample Listing 01 | 纽约 | Midtown, Manhattan | $3,850/月 | 2 室 1 卫 780 sqft |
| Sample Listing 02 | 纽约 | Long Island City, NY | $2,900/月 | 1 室 1 卫 620 sqft |
| Sample Listing 03 | 纽约 | Jersey City, NJ | $3,200/月 | Studio 1 卫 480 sqft |
| Sample Listing 04 | 芝加哥 | West Loop, Chicago | $2,450/月 | 1 室 1 卫 700 sqft |
| Sample Listing 05 | 洛杉矶 | Downtown LA | $3,100/月 | 2 室 2 卫 950 sqft |
| Sample Listing 06 | 华盛顿特区 | Capitol Hill, D.C. | $2,700/月 | 1 室 1 卫 640 sqft |

示例房源在前台正常展示，但 `noindex`、不进站点地图、详情页不输出房源结构化数据。

### 5.6 权限

在现有权限矩阵中新增一组，沿用“范围角色 + 动作角色”：

| 角色 | 范围 | 能做什么 |
|---|---|---|
| `uswoo_official_admin` | 全局 | 全部，含全站页面、地区、站点设置 |
| `uswoo_official_ny`、`_boston`、`_chicago`、`_la`、`_dc`、`_phl` | 单个地区 | 读写本地区的文章、房源、页面、City Guide、咨询 |
| `uswoo_official_publish` | 动作 | 发布、定时、下线（没有它只能存草稿） |
| `uswoo_official_migrate` | 动作 | 使用旧文章、旧房源迁移 |
| `uswoo_official_delete` | 动作 | 归档 |
| `uswoo_official_leads` | 动作 | 查看与处理咨询、导出 |

- 现有 `uswoo_web_admin` 自动拥有全部新官网权限。
- 文章属于多个地区时，操作人须对其中至少一个地区有权限；增删地区关联时，须对被增删的那个地区有权限。
- 全国文章（`is_national`）与全站页面只有全局管理员可改。
- 与现有做法一致：超级管理员不自动放行，服务层在查询与写入时都校验地区。

### 5.7 缓存刷新通知

- 新建 `OfficialSiteRevalidateGateway`，读取一组目标（每个含地址与密钥），逐个发送。目标登记两个：测试站、正式站。
- 配置放在后端的本地运行配置中，不进代码仓库。
- 修正 2.3 所列两处缺陷：请求头写成 `名称: 值` 的字符串；先执行请求再读状态码。同样的修正应用到现有 `UswooWebRevalidateGateway`。
- 定时发布：每分钟检查一次到点的文章，发送对应标签。

### 5.8 种子数据导入

提供一次性脚本，从新官网仓库 `seed/` 目录导入，支持试运行与重复执行（按 slug 或自然键更新）。

| 内容 | 来源 | 数量 |
|---|---|---|
| 地区 | 本文 5.1 | 6 |
| 站点设置 | 现有页脚、导航、合规声明 | 1 |
| 首页、Services、Contact | 对应 `.dc.html` 与中文字典 | 各 1 |
| About、Partners（全站默认） | 对应 `.dc.html` 与中文字典 | 各 1 |
| 文章：公告 | 两篇 News 页 | 2 |
| 文章：租客故事 | 三篇 Story 页 | 3 |
| 文章：外部媒体 | QNS、Commercial Observer | 2 |
| 文章：品牌动态 | Brand Moments 三张卡片 | 3 |
| 示例房源 | 见 5.5 | 6 |
| City Guide：纽约 | `AREA_GUIDES`、`areas.json`、`schools.json`、`poi.json`、logo 索引 | 主体 1 + 点位 72 |
| City Guide：芝加哥、洛杉矶、华盛顿特区、费城 | `AREA_GUIDES`、`areas.json`、`schools.json`、`poi-extra.json`、logo 索引 | 主体各 1 + 点位 50 / 59 / 44 / 41 |
| City Guide：波士顿 | 复制纽约，见 6.4 | 主体 1 + 点位 72 |
| 片区边界、商圈边界、地铁线路 | `neighborhoods.geojson`、`business-districts.geojson`、`assets/transit/*` | 按地区拆分后上传 CDN，五个地区 |
| 图片 | `assets/` 与 `.image-slots.state.json` | 上传媒体库，按内容哈希去重 |

## 6. 地区模型

### 6.1 页面的地区行为

| 页面 | 行为 |
|---|---|
| 首页、Services、Contact | 只有全站一份 |
| About、Partners | 地区可单独配置；未配置时显示全站默认 |
| City Guide | 每个地区一份，没有全站默认 |
| Listings | 按 `region_id` 归属，一条房源只属于一个地区 |
| 文章 | 可属于多个地区；`is_national` 的文章出现在所有地区 |

### 6.2 回退与重复内容

About、Partners 回退到全站默认时，六个地区网址的内容相同。处理方式：回退中的地区页 canonical 指向不带地区的汇总页（`/about`、`/partners`），并且不进站点地图；该地区单独配置内容后，canonical 自动改回自身。

### 6.3 纽约与新泽西

- 一个地区，slug `new-york`，显示名 “New York & New Jersey”，短码 `NYC`。
- 新泽西的片区（Jersey City、Hoboken 等）作为该地区 City Guide 的片区，房源的 `neighborhood` 照常填写。
- 康州不建地区；旧数据中康州的内容不提供默认地区映射。

### 6.4 City Guide 数据与占位

| 地区 | 数据 | 是否占位 |
|---|---|---|
| 纽约 | 现有真实数据 | 否 |
| 芝加哥、洛杉矶、华盛顿特区、费城 | 现有真实数据（片区文案、学校、商圈、地标、片区边界、地铁线路） | 否 |
| 波士顿 | 无现成数据，复制纽约 | 是 |

- 五个有数据的地区由种子脚本直接导入，上线即可收录。
- 波士顿：初始化时把纽约的 City Guide 主体与全部点位在数据库中复制一份，写入 `is_placeholder = 1` 与 `copied_from_region_id`。
- 占位地区的页面正常可访问，但 `noindex`、不进站点地图，页面上不加提示（对访客与正式内容无差别，仅对搜索引擎隐藏）。
- CMS 中占位地区显示“占位内容（复制自纽约）”标记；编辑保存真实内容后手动取消占位标记，取消后才开放收录。
- `copy-from` 接口保留，后续新增地区时可再次使用。

## 7. Vectra 前端新增

### 7.1 菜单

在“美窝房产CMS”下新增一组「新官网」，条目加入 `catalog.ts`：

| 菜单 | 路径 | 页面 |
|---|---|---|
| Press & Stories | `/uswoo-web/official/posts` | 列表 + 文章编辑器 |
| 房源 | `/uswoo-web/official/listings` | 列表 + 房源编辑器 |
| City Guides | `/uswoo-web/official/guides` | 地区页签 + 主体编辑 + 点位表 |
| 页面内容 | `/uswoo-web/official/pages` | 首页、Services、Contact、About、Partners |
| 咨询 | `/uswoo-web/official/leads` | 列表、处理、导出 |
| 地区 | `/uswoo-web/official/regions` | 六个地区的名称、排序、上下线、SEO |
| 站点设置 | `/uswoo-web/official/settings` | 导航、页脚、社交链接、默认 SEO |

- 接口文件 `src/api/uswoo-official.ts`，通用资源的域类型新增 `official`，前缀指向 `/backend_v2/uswoo-web/admin/official`。
- 路由权限新增 `USWOO_OFFICIAL_ROLES`；按钮与字段权限全部来自后端能力描述，与现有 CMS 页面一致。

### 7.2 文章

- 列表筛选：类型、地区、状态、关键词；全部筛选条件写入网址。列：标题、类型、地区、状态、发布时间、更新人。
- 编辑器：
  - 中英文并排编辑标题、摘要、正文。
  - 地区多选，或勾选“全国”。
  - 封面从媒体库选。
  - 外部媒体报道：填来源名称与外链后，正文区域隐藏。
  - 状态操作：存草稿、发布、定时发布、下线、归档。
  - SEO 区块：标题、描述、分享图，实时显示网址预览。
  - “预览”按钮：生成限时预览链接，可选在测试站或正式站打开。
  - 历史版本查看与恢复。
- 富文本：正文图片改为上传到媒体库并插入 CDN 地址（2.3 所列缺陷的修正）；仅对新官网的编辑器生效，不改动其他模块的行为。

### 7.3 迁移入口

- 旧「文章管理」与旧「房源」列表：行操作与批量操作新增「迁移到新官网」。
- 迁移对话框：选择类型（文章）或确认地区（房源）→ 先展示试运行结果与问题清单 → 确认后执行。
- 已迁移的行显示「已迁移」标记，点击跳到新官网对应条目。
- 仅持有 `uswoo_official_migrate` 的用户可见该操作。

### 7.4 页面内容与 City Guide

- 页面内容：按 `page_key` 提供结构化表单（不是让编辑写 JSON）。About、Partners 上方有地区页签，每个地区有“沿用全站默认”开关；关闭开关时以全站默认内容为起点开始编辑。
- City Guide：地区页签；主体表单（导语、片区卡片、结语）+ 点位表（按类型筛选，支持新增、排序、上下线）；“从其他地区复制”操作；占位标记的显示与取消。
- 片区边界与地铁线路文件暂不在 CMS 中编辑，只显示当前文件地址。

### 7.5 工程要求

- 文案：`locales/uswoo-official/` 下五种语言，繁体三种手写。
- 菜单标题键加入五个核心语言文件。
- 更新契约测试，新增资源、接口路径、语言键的断言。
- 表格用 `PureTableBar`，日期范围用 `ReDateRangePicker`，详情页面包屑与列表详情的网址状态按前端规范处理。
- 新增错误键登记到 `locales/api-errors/`。
- 前后端各写 ChangeLog 并互相引用。
- 用户手册 `docs/user-guide` 补充「新官网」一节。

## 8. 部署与发布流程

### 8.1 Vectra 后端

依据 Vectra 前端仓库的《后端部署与运行配置权限规范》与后端开发指引执行，已获授权直接上生产。要点：

1. 改既有文件前先从生产取当前版本，在其上施加改动；上传前校验“上传件 = 生产件 + 本次改动”。
2. 只按清单逐个上传文件；不同步目录，不上传任何本地运行配置。
3. 上传前记录目标文件的属主与权限，上传后复核；新文件显式设置属主与权限。
4. 建表：先上传迁移脚本与回滚脚本 → 备份受影响的数据 → 跑前置检查 → 执行 → 当场验证表结构 → 再上传依赖新表的代码。本次全部是新增表，不改动现有表。
5. 新增类后重建自动加载映射，并重启常驻进程。
6. 上传后跑运行配置可读性门禁、语法检查、受影响的测试、接口冒烟（公开接口返回 200，管理接口未登录返回 401）。
7. 每次改动都写后端 ChangeLog：先取服务器上的最新版，插入条目，立即单独上传。
8. 提交时只添加本次改动的文件，推送到后端仓库 `main`。
9. 路由文件最后上传，保证接口对外可见时依赖都已就位。

### 8.2 Vectra 前端

- 推送 `main` 即触发自动构建并发布到生产。
- 本机不运行构建和开发服务器；提交前跑完整的静态检查与单元测试。
- 新菜单在后端接口上线之后再推送，避免生产上出现打不开的菜单。
- 当前本机 `main` 有 2 个尚未推送的提交。新官网相关改动从远端 `main` 的最新状态开新分支开发，合并前确认不会把无关的本地提交一起带上线。

### 8.3 uswoo.com 反向代理

在 uswoo.com 的站点配置中新增一段，位置在现有 `/vectraapi/` 旁：

| 要求 | 说明 |
|---|---|
| 只匹配 `/api/uswoo/public/` | 不转发其他 `/api/` 路径，Vectra 的管理接口不对外暴露 |
| 经内网转发到 Vectra 后端 | 纯前缀转发，不改写路径 |
| 排除移动端跳转 | 在站点级的移动端跳转规则之前放行这个前缀，写法与现有 `/vectraapi/` 的放行一致 |
| 透传访客真实 IP | 咨询表单限流依赖它 |
| 跨域 | 只对来源 `new.uswoo.cn` 输出允许头，并处理预检请求 |
| 限流 | 对 `POST /api/uswoo/public/leads` 单独限流（随咨询接口一起上线时再加） |
| 请求体上限 | 1MB（没有文件上传） |

**当前状态（2026-11-10）**：反代已上线。经外部验证：

| 检查 | 结果 |
|---|---|
| `https://uswoo.com/api/uswoo/public/*` | 到达 Vectra 后端（接口尚未开发，返回后端的 404 信封） |
| 手机浏览器访问接口 | 不再被跳到 `m.uswoo.com` |
| 来源 `https://new.uswoo.cn` | 收到允许跨域的响应头；预检请求返回 204 |
| 其他来源 | 不输出允许跨域的头 |
| 现有官网首页、`/vectraapi/`、手机跳转、小程序接口 | 均与改动前一致 |

脱敏后的配置见 `deploy/nginx/`。

操作规程（这台机器上还运行着现有官网、小程序接口、移动站和英国站）：

1. 修改前把要改的配置文件复制一份带时间戳的备份。
2. 修改后先做配置语法检查，通过后才平滑重载；不重启 Nginx。
3. 重载后立即验证：现有官网首页、小程序接口、`/vectraapi/` 各访问一次确认正常，再验证新接口。
4. 任一验证失败，立刻用备份还原并重载。
5. 配置文件的脱敏版本（不含证书路径与内网地址）存入本仓库 `deploy/nginx/`，作为变更记录。

### 8.4 测试站 `new.uswoo.cn`

**当前状态（2026-11-10）**：解析已指向 uswoo.com 所在机器；`https://new.uswoo.cn` 已可访问，返回占位页，全站带禁止收录的响应头，HTTP 自动跳转 HTTPS；发布目录已建好；证书已签发并配置每周自动续期（机器自带的 certbot 已损坏，用的是容器版）。**还差应用容器**，等 Nuxt 工程有了第一个可运行版本后部署。

首次部署：

1. 机器上建发布目录：各版本的构建产物、当前版本的指向、环境文件、缓存目录。（已完成）
2. 新增 Nginx 站点文件 `new.uswoo.cn`：80 端口先只提供证书验证路径。（已完成）
3. 用容器版 certbot 签发证书，配置自动续期后的重载。（已完成）
4. 站点文件补上 443：开启压缩，全站输出禁止收录的响应头。（已完成，目前返回占位页；容器上线后改为转发到容器）
5. 启动容器并验证。

每次发布：

1. 在 `refactor/nuxt-cms` 分支上构建，产物打包。构建在本机或 CI 上进行，不在这台机器上构建，避免占用现有服务的资源。
2. 经跳板上传到发布目录的新版本子目录。
3. 切换当前版本指向，重启容器。
4. 验证：首页返回 200 且网页源代码中有正文；接口请求成功；禁止收录的响应头存在。
5. 保留最近三个版本，回滚即把指向切回上一版并重启容器。

约束：构建产物必须能在 Linux x64 的 Node 22 容器中运行，不引入需要本机编译的依赖。

### 8.5 生产切换

1. 用测试通过的同一个构建产物，以生产环境变量启动第二个容器（独立端口）。
2. 备份 uswoo.com 的站点配置。
3. 修改配置：`location /` 的转发目标从现有官网改为新官网容器。
4. 删除三条移动端跳转规则（新官网是响应式的，不再跳 `m.uswoo.com`）。这一条需要你确认，见第 10 节。
5. 语法检查 → 平滑重载 → 验证首页、各地区页、接口、站点地图。
6. 在后端把正式站登记为缓存刷新目标。
7. 现有官网进程保留不动，回滚只需还原配置并重载。
8. 稳定后提交站点地图，再决定现有官网进程和 `main` 上静态站的下线时间。

## 9. 实施步骤

| 阶段 | 内容 | 完成标志 |
|---|---|---|
| 1 反代与测试站空壳 | uswoo.com 反代配置；`new.uswoo.cn` 站点、证书、容器；发布脚本 | 测试站能打开一个占位页；`/api/uswoo/public/` 能到达后端（接口未上线时返回后端的 404） |
| 2 后端地基 | 建表；地区、文章、房源、页面、City Guide、咨询的服务与公开接口；刷新通知；种子导入 | 公开接口契约测试通过；种子数据导入生产；经 uswoo.com 能取到数据 |
| 3 CMS 界面 | 「新官网」菜单全部页面；文章与房源迁移入口；富文本图片修正 | 运营可在 CMS 完成一篇文章从新建到发布的全流程；可迁移一篇旧文章和一条旧房源 |
| 4 新官网骨架 | Nuxt 工程、布局、导航、页脚、多语言、设计变量、请求层、缓存刷新、预览；首页、Services、Contact | 三个页面在测试站上与现有设计一致，查看网页源代码可见正文 |
| 5 内容页面 | Press & Stories、Listings、About、Partners、City Guides | 六个地区全部页面可访问；CMS 改动后页面在一分钟内更新 |
| 6 SEO 与性能 | 站点地图、结构化数据、hreflang、图片与字体优化 | 结构化数据校验通过；移动端性能评分达标 |
| 7 生产切换 | 按 8.5 执行 | uswoo.com 指向新官网；测试站保持禁止收录 |

- 阶段 2、3 与阶段 4 并行：新官网开发期间先用仓库内的模拟接口，后端接口上线后切到真实接口。
- 所有重构工作在 `refactor/nuxt-cms` 分支进行，直接发布到测试站；`main` 分支的静态站保持不动。

## 10. 风险与待定事项

| 事项 | 说明 | 需要谁 |
|---|---|---|
| `new.uswoo.cn` 解析 | 目前指向 Vectra 后端所在机器；改为指向 uswoo.com 所在机器后才能签证书、上线测试站 | 你方 |
| 生产切换时的移动端跳转 | uswoo.com 现在把手机访客跳到 `m.uswoo.com`。新官网上线后是否取消跳转、`m.uswoo.com` 是否保留，需要决定 | 你方 |
| 现有官网的功能 | uswoo.com 现有官网有登录、发布房源等功能，新官网没有。切换后这些入口消失，需确认可接受 | 你方 |
| 同机部署的资源 | 这台机器同时运行现有官网、小程序接口等。新官网容器限制内存与 CPU；构建不在这台机器上进行 | 已在流程中处理 |
| Nginx 误操作 | 配置错误会影响同机所有站点。每次改动先备份、先做语法检查、只平滑重载、立即验证、失败即还原 | 已在流程中处理 |
| 测试站读生产数据 | 测试期间在 CMS 发布的内容，测试站和正式站都能看到。草稿用预览链接查看 | 知情即可 |
| 测试站提交表单 | 会写入真实的咨询表，已用来源标记区分，CMS 列表默认过滤测试来源 | 知情即可 |
| Vectra 前端本地未推送的提交 | 本机 `main` 领先远端 2 个提交，推送会一并发布 | 你方确认 |
| 市场同事的工作方式 | 重构后内容在 CMS 中维护，版式改动需要走代码。需要提前沟通并安排 CMS 培训 | 你方 |
| 波士顿内容 | City Guide 用纽约占位（不被收录），地区卡片配图也无现成素材，需要市场提供真实内容 | 市场 |
| 仓库公开 | 本仓库公开，接口契约、环境变量名、脱敏后的 Nginx 配置会出现在仓库中；密钥、内网地址、服务器地址一律不入库 | 知情即可 |
