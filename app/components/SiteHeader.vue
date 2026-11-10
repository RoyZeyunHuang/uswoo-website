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
      <NuxtLink
        ref="toggle"
        class="lang-toggle"
        :to="switchLocalePath(isZh ? 'en' : 'zh')"
        :aria-label="isZh ? 'Switch to English' : '切换为中文'"
        :style="{ color: toggleColor }"
      >
        <span data-l="en">EN</span><span class="sep">/</span><span data-l="zh">中文</span>
      </NuxtLink>
      <button type="button" class="uswoo-burger" aria-label="Menu" :aria-expanded="open" @click.stop="open = !open"><span /></button>
    </div>
    <div class="uswoo-menu">
      <NuxtLink v-for="item in items" :key="item.key" :to="localePath(item.path)" :class="{ active: active === item.key }" @click="open = false">
        {{ c(item.label) }}
      </NuxtLink>
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

const { tx, isZh } = useTx();
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
  if (event.key === "Escape") open.value = false;
}
function onDocClick(event: MouseEvent) {
  if (el.value && !el.value.contains(event.target as Node)) open.value = false;
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
