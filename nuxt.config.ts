// 新官网（uswoo.com）：Nuxt 4 + SSR。内容来自 Vectra 的美窝房产CMS，接口见 docs/refactor-plan.md 第 5.2 节。
export default defineNuxtConfig({
  compatibilityDate: "2026-07-01",
  devtools: { enabled: false },
  modules: ["@nuxtjs/i18n"],

  css: ["~/assets/css/base.css", "~/assets/css/chrome.css", "~/assets/css/mobile-type.css"],

  runtimeConfig: {
    apiBaseServer: "",
    apiHostHeader: "",
    revalidateSecret: "",
    public: {
      siteUrl: "https://uswoo.com",
      apiBase: "https://uswoo.com/api/uswoo/public",
      deployEnv: "staging"
    }
  },

  i18n: {
    // 英文是默认语言、无前缀；中文在 /zh。网址决定语言，不按浏览器语言自动跳转。
    strategy: "prefix_except_default",
    defaultLocale: "en",
    detectBrowserLanguage: false,
    baseUrl: "https://uswoo.com",
    locales: [
      { code: "en", language: "en-US", name: "EN" },
      { code: "zh", language: "zh-CN", name: "中文" }
    ]
  },

  app: {
    head: {
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" }
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,200;0,300;0,500;0,600;0,700;0,800;1,500&family=Inter:wght@400;500;600;700&display=swap"
        }
      ]
    }
  },

  typescript: { strict: true },

  // 页面缓存（只在构建产物里生效，本地开发不缓存）：整页输出不含访客相关内容，可以直接缓存。
  // 时长只是兜底——CMS 保存内容后后端会通知 /_site/revalidate 立即清空缓存。
  // 缓存放在进程内存里：单实例运行足够，发布新版本时随容器重启自然清空。
  $production: {
    routeRules: {
      "/**": { swr: 600 },
      "/_site/**": { swr: false, cache: false },
      "/zh/_site/**": { swr: false, cache: false },
      "/sitemap.xml": { swr: false, cache: false },
      "/robots.txt": { swr: false, cache: false }
    }
  },

  // 本地开发：浏览器经开发服务器转发接口请求（uswoo.com 的跨域白名单里只有测试站，没有 localhost）
  $development: {
    runtimeConfig: {
      apiBaseServer: "https://uswoo.com/api/uswoo/public",
      public: { apiBase: "/api/uswoo/public" }
    },
    nitro: {
      devProxy: {
        "/api/uswoo/public": { target: "https://uswoo.com/api/uswoo/public", changeOrigin: true }
      }
    }
  }
});
