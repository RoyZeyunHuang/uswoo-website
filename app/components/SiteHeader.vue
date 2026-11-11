<template>
  <header id="siteNav" ref="el" class="nav" :class="{ scrolled, 'menu-open': open, 'uswoo-solid': solid }">
    <div class="nav-inner">
      <NuxtLink class="wordmark" :to="localePath('/')">
        <!-- CMS 里配置了 logo 图片就显示图片，否则显示文字标识 -->
        <img v-if="img('brand.logo')" class="wordmark-logo" :src="img('brand.logo')" :alt="c('brand.siteName')" />
        <template v-else>{{ c("brand.wordmark") }}</template>
      </NuxtLink>
      <nav class="links">
        <NuxtLink v-for="item in items" :key="item.key" :to="localePath(item.path)" :class="{ active: active === item.key }">{{ c(item.label) }}</NuxtLink>
      </nav>
      <NuxtLink class="nav-cta" :to="localePath('/contact')">{{ c("nav.contact") }}</NuxtLink>
      <!-- 语言与地区两个切换放在一组里，尺寸一致、间距固定 -->
      <div class="nav-tools">
        <NuxtLink
          ref="toggle"
          class="lang-toggle"
          :to="switchLocalePath(isZh ? 'en' : 'zh')"
          :aria-label="isZh ? 'Switch to English' : '切换为中文'"
          :style="{ color: toggleColor }"
        >
          <span data-l="en">EN</span><span class="sep">/</span><span data-l="zh">中文</span>
        </NuxtLink>
        <!-- 地区切换：在分地区的页面上换到所选地区的同一类页面；其他页面只记住选择，之后导航里的链接都指向这个地区 -->
        <div class="region-switch" :class="{ open: regionOpen }">
          <button type="button" class="region-toggle" :style="{ color: toggleColor }" :aria-expanded="regionOpen" :aria-label="c('nav.regionLabel')" @click.stop="regionOpen = !regionOpen">
            <span>{{ activeRegion ? activeRegion.shortCode || bi(activeRegion.name) : c("nav.regionLabel") }}</span>
            <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" /></svg>
          </button>
          <div class="region-menu">
            <NuxtLink :to="regionTarget(null)" :class="{ active: !activeRegion }" @click="pickRegion(null)">{{ c("nav.allRegions") }}</NuxtLink>
            <NuxtLink v-for="region in regions" :key="region.slug" :to="regionTarget(region.slug)" :class="{ active: activeRegion?.slug === region.slug }" @click="pickRegion(region.slug)">
              <span class="region-emoji" aria-hidden="true">{{ region.emoji }}</span>{{ bi(region.name) }}
            </NuxtLink>
          </div>
        </div>
      </div>
      <button type="button" class="uswoo-burger" aria-label="Menu" :aria-expanded="open" @click.stop="open = !open"><span /></button>
    </div>
    <div class="uswoo-menu">
      <NuxtLink v-for="item in items" :key="item.key" :to="localePath(item.path)" :class="{ active: active === item.key }" @click="open = false">
        {{ c(item.label) }}
      </NuxtLink>
      <!-- 手机上地区切换放在菜单里 -->
      <div class="uswoo-menu-regions">
        <div class="uswoo-menu-label">{{ c("nav.regionLabel") }}</div>
        <div class="uswoo-menu-chips">
          <NuxtLink :to="regionTarget(null)" :class="{ active: !activeRegion }" @click="pickRegion(null)">{{ c("nav.allRegions") }}</NuxtLink>
          <NuxtLink v-for="region in regions" :key="region.slug" :to="regionTarget(region.slug)" :class="{ active: activeRegion?.slug === region.slug }" @click="pickRegion(region.slug)">
            {{ region.emoji }} {{ bi(region.name) }}
          </NuxtLink>
        </div>
      </div>
      <NuxtLink class="uswoo-menu-cta" :to="localePath('/contact')" @click="open = false">{{ c("nav.contact") }}</NuxtLink>
    </div>
  </header>
</template>

<script setup lang="ts">
/**
 * 全站导航。样式来自各页面自己的样式表（有深色首屏的页面导航透明、滚动后变实底）。
 * `scrolled` 由页面决定（通常是首屏滚出视口之后）。
 */
const props = defineProps<{ active?: string; scrolled?: boolean }>();

const { tx, isZh, bi } = useTx();
// 导航文字来自 CMS「新官网页面 → 全站通用」
const { c, img } = await useSite();
const localePath = useLocalePath();
const switchLocalePath = useSwitchLocalePath();
const route = useRoute();

/**
 * 访客上次看的地区，只用来生成导航链接（看过芝加哥的 City Guide，再点 Listings 就直接到芝加哥的房源）。
 * 记在浏览器本地、挂载后才读取：服务端输出的页面里永远是不带地区的汇总页链接，整页仍可缓存。
 */
const REGION_KEY = "uswoo_region";
const lastRegion = ref<string | null>(null);

const items = computed(() => [
  { key: "services", label: "nav.services", path: "/services" },
  { key: "city-guides", label: "nav.cityGuides", path: regionPath("city-guide", lastRegion.value) },
  { key: "listings", label: "nav.listings", path: regionPath("listings", lastRegion.value) },
  { key: "press", label: "nav.press", path: regionPath("press", lastRegion.value) },
  { key: "partners", label: "nav.partners", path: regionPath("partners", lastRegion.value) },
  { key: "about", label: "nav.about", path: regionPath("about", lastRegion.value) }
]);

// ---- 地区切换 ----

const regions = await useRegions();
const regionOpen = ref(false);
/** 网址里的地区（分地区的页面上，服务端就能确定） */
const routeRegion = computed(() => (typeof route.params.region === "string" ? route.params.region : null));
/** 当前地区：分地区的页面以网址为准，其他页面用访客上次的选择（挂载后才知道） */
const activeRegion = computed(() => regions.value.find(region => region.slug === (routeRegion.value ?? lastRegion.value)) ?? null);

/** 路由名（去掉语言后缀）→ 分地区的页面类型；不在表里的页面（首页、Services、详情页等）没有地区版本 */
const REGIONAL_ROUTES: Record<string, RegionalPage> = {
  "city-guides": "city-guide",
  "region-city-guide": "city-guide",
  listings: "listings",
  "region-listings": "listings",
  press: "press",
  "region-press": "press",
  partners: "partners",
  "region-partners": "partners",
  about: "about",
  "region-about": "about"
};
/** 选了某个地区后要去的地址：当前是分地区的页面就换到那个地区的同一类页面，否则留在原地 */
function regionTarget(slug: string | null) {
  const page = REGIONAL_ROUTES[String(route.name ?? "").replace(/___[a-z]+$/, "")];
  return page ? localePath(regionPath(page, slug)) : route.fullPath;
}
function pickRegion(slug: string | null) {
  regionOpen.value = false;
  open.value = false;
  lastRegion.value = slug;
  try {
    if (slug) localStorage.setItem(REGION_KEY, slug);
    else localStorage.removeItem(REGION_KEY);
  } catch {
    // 浏览器禁用了本地存储：这次的选择只在当前页面有效
  }
}

onMounted(() => {
  try {
    const current = typeof route.params.region === "string" ? route.params.region : "";
    if (/^[a-z-]{2,40}$/.test(current)) localStorage.setItem(REGION_KEY, current);
    const saved = localStorage.getItem(REGION_KEY);
    if (saved && /^[a-z-]{2,40}$/.test(saved)) lastRegion.value = saved;
  } catch {
    // 浏览器禁用了本地存储：保持汇总页链接
  }
});

const el = ref<HTMLElement | null>(null);
const open = ref(false);
const solid = ref(false);
const toggleColor = ref<string>();

/** 语言切换的颜色跟随导航链接（首屏上是白色，滚动后是深色） */
function syncColor() {
  const link = el.value?.querySelector<HTMLElement>("nav.links a:not(.active)") ?? el.value?.querySelector<HTMLElement>("nav.links a");
  if (link) toggleColor.value = getComputedStyle(link).color;
}

/** 没有深色首屏的页面导航是浅色实底：白色的菜单按钮会看不见 */
function detectSolid() {
  if (!el.value) return;
  const color = getComputedStyle(el.value).backgroundColor;
  let parts = (color.match(/[\d.]+/g) ?? []).map(Number);
  if (color.startsWith("color(")) parts = [parts[0]! * 255, parts[1]! * 255, parts[2]! * 255, parts[3] ?? 1];
  solid.value = parts.length >= 3 && (parts[0]! + parts[1]! + parts[2]!) / 3 > 200 && (parts.length < 4 || parts[3]! > 0.5);
}

function onKey(event: KeyboardEvent) {
  if (event.key === "Escape") {
    open.value = false;
    regionOpen.value = false;
  }
}
function onDocClick(event: MouseEvent) {
  const target = event.target as Node;
  if (el.value && !el.value.contains(target)) open.value = false;
  if (!(target instanceof Element) || !target.closest(".region-switch")) regionOpen.value = false;
}
function onResize() {
  if (window.innerWidth > 760) open.value = false;
}

watch(
  () => props.scrolled,
  () => {
    syncColor();
    // 颜色有 0.3s 过渡，过渡结束后再取一次
    setTimeout(syncColor, 340);
  }
);
watch(() => route.fullPath, () => (open.value = false));

onMounted(() => {
  detectSolid();
  syncColor();
  document.addEventListener("keydown", onKey);
  document.addEventListener("click", onDocClick);
  window.addEventListener("resize", onResize);
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKey);
  document.removeEventListener("click", onDocClick);
  window.removeEventListener("resize", onResize);
});

defineExpose({ el });
</script>

<style>
/* 语言切换原先是 <button>，现在是链接（每种语言有自己的网址） */
a.lang-toggle {
  text-decoration: none;
}
</style>
