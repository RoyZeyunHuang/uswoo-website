<template>
  <div class="pg pg-press">
    <SiteHeader active="press" />

    <main id="top">
      <section v-if="lead" id="featured-press" class="band-paper">
        <div class="wrap">
          <div class="section-head">
            <p class="eyebrow"><span class="idx">{{ sectionIndex("press") }}</span> {{ c("featured.eyebrow") }}</p>
            <h2>{{ c("featured.title") }}</h2>
          </div>

          <div class="press-grid" :class="{ solo: !latest.length }">
            <component :is="linkTag(lead)" class="press-feature" v-bind="linkAttrs(lead)">
              <div class="press-feature-media">
                <SlotImage :src="lead.cover?.url" :radius="14" :alt="coverAlt(lead)" eager />
              </div>
              <div class="press-feature-body">
                <div class="press-feature-meta">
                  <span class="src">{{ sourceLabel(lead) }}</span>
                  <template v-if="lead.publishedAt"><span>·</span><span>{{ formatDate(lead.publishedAt) }}</span></template>
                </div>
                <h3>{{ bi(lead.title) }}</h3>
              </div>
            </component>

            <div v-if="latest.length">
              <p class="press-latest-head">{{ c("featured.latestHeading") }}</p>
              <div class="press-side-list">
                <component :is="linkTag(post)" v-for="post in latest" :key="post.id" class="press-side-item" v-bind="linkAttrs(post)">
                  <div class="press-side-text">
                    <h4>{{ bi(post.title) }}</h4>
                    <div class="press-side-tags">
                      <span class="src">{{ sourceLabel(post) }}</span>
                      <template v-if="post.publishedAt"><span>·</span><span>{{ formatDate(post.publishedAt) }}</span></template>
                    </div>
                  </div>
                  <div v-if="post.cover" class="press-side-media"><SlotImage :src="post.cover.url" :radius="10" :alt="coverAlt(post)" /></div>
                </component>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="stories.length" id="renter-stories" class="band-raised">
        <div class="wrap">
          <div class="section-head-row">
            <div class="section-head">
              <p class="eyebrow"><span class="idx">{{ sectionIndex("story") }}</span> {{ c("stories.eyebrow") }}</p>
              <h2>{{ c("stories.title") }}</h2>
            </div>
          </div>

          <div class="story-grid">
            <component :is="linkTag(post)" v-for="post in stories" :key="post.id" class="media-card story-card" v-bind="linkAttrs(post)">
              <div class="media-card-media">
                <SlotImage :src="post.cover?.url" :radius="8" :alt="coverAlt(post)" />
              </div>
              <div class="media-card-body">
                <h3>{{ bi(post.title) }}</h3>
                <p v-if="bi(post.summary)">{{ bi(post.summary) }}</p>
                <div v-if="post.publishedAt || post.readMinutes" class="story-card-meta">
                  <span v-if="post.publishedAt">{{ formatDate(post.publishedAt) }}</span>
                  <span v-if="post.publishedAt && post.readMinutes" class="dot" />
                  <span v-if="post.readMinutes">{{ readTime(post.readMinutes) }}</span>
                </div>
                <span class="story-more">{{ c("stories.cardLink") }}</span>
              </div>
            </component>
          </div>
        </div>
      </section>

      <section v-if="moments.length" id="brand-moments" class="band-paper">
        <div class="wrap">
          <div class="section-head">
            <p class="eyebrow"><span class="idx">{{ sectionIndex("moment") }}</span> {{ c("moments.eyebrow") }}</p>
          </div>

          <div class="moments-row">
            <component
              :is="post.externalUrl ? 'a' : 'div'"
              v-for="(post, index) in moments"
              :key="post.id"
              class="moment-item icon-grid"
              v-bind="post.externalUrl ? { href: post.externalUrl, target: '_blank', rel: 'noopener' } : {}"
            >
              <span class="press-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="momentIcons[index % momentIcons.length]" />
              </span>
              <h4>{{ bi(post.title) }}</h4>
              <p v-if="bi(post.summary)">{{ bi(post.summary) }}</p>
            </component>
          </div>
        </div>
      </section>

      <section v-if="isEmpty" class="band-paper press-empty">
        <div class="wrap">
          <p class="eyebrow">{{ c("empty.eyebrow") }}</p>
          <p class="lede">{{ c("empty.text") }}</p>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import "~/assets/css/pages/press.css";
import "~/assets/css/pages/press.extra.css";
import { NuxtLink } from "#components";
import type { Paged, PostSummary, PostType } from "~~/shared/types/api";

const props = defineProps<{ region?: string }>();

const { tx, bi } = useTx();
const localePath = useLocalePath();
const api = useApi();
const { c } = await usePageContent("press");
// 先校验地区：不存在的地区是真实的 404
const { region } = await useRegion(props.region);

// ---- 内容：三个板块的卡片全部来自 CMS ----

/** 各板块取的条数。报道 = 1 篇主推 + 右侧列表 */
const PAGE_SIZE: Record<PostType, number> = { press: 7, story: 12, moment: 6 };

const { data } = await useAsyncData(`press:${props.region ?? ""}`, async () => {
  const load = (type: PostType) =>
    api<Paged<PostSummary>>("/posts", { query: { type, region: props.region, pageSize: PAGE_SIZE[type] } })
      .then(result => result.list)
      .catch(() => [] as PostSummary[]);
  const [press, story, moment] = await Promise.all([load("press"), load("story"), load("moment")]);
  return { press, story, moment };
});

const press = computed(() => data.value?.press ?? []);
const stories = computed(() => data.value?.story ?? []);
const moments = computed(() => data.value?.moment ?? []);
/** 主推卡片：优先用标了「精选」的，没有就用最新的一篇 */
const lead = computed(() => press.value.find(post => post.isFeatured) ?? press.value[0] ?? null);
const latest = computed(() => press.value.filter(post => post.id !== lead.value?.id));
const isEmpty = computed(() => !press.value.length && !stories.value.length && !moments.value.length);

/** 板块序号：没有内容的板块不渲染，序号顺延 */
function sectionIndex(type: PostType): string {
  const shown = (["press", "story", "moment"] as const).filter(key => (data.value?.[key] ?? []).length);
  return String(shown.indexOf(type) + 1).padStart(2, "0");
}

/** 外部媒体报道直接外链（新窗口），其余进站内详情页 */
function linkTag(post: PostSummary) {
  return post.externalUrl ? "a" : NuxtLink;
}
function linkAttrs(post: PostSummary): Record<string, string> {
  return post.externalUrl ? { href: post.externalUrl, target: "_blank", rel: "noopener" } : { to: localePath(`/press/${post.slug}`) };
}

/** 来源：外部报道显示媒体名，自家发布的显示「USWOO Announcement」 */
function sourceLabel(post: PostSummary): string {
  return post.sourceName || c("ownSource");
}
function coverAlt(post: PostSummary): string {
  return bi(post.cover?.alt) || bi(post.title);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** 只取日期部分自己拼，避免服务端与浏览器时区不同导致差一天 */
function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return "";
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return tx("{month} {day}, {year}")
    .replace("{monthNumber}", String(month))
    .replace("{month}", MONTHS[month - 1] ?? "")
    .replace("{day}", String(day))
    .replace("{year}", String(year));
}
function readTime(minutes: number): string {
  return tx("{n} min read").replace("{n}", String(minutes));
}

/** Brand Moments 的图标沿用设计稿的三个（定位、链接、奖章），按顺序循环使用 */
const momentIcons = [
  '<path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  '<path d="M10.2 13.8a5 5 0 0 0 7.1 0l2.3-2.3a5 5 0 0 0-7.1-7.1l-1.3 1.3"/><path d="M13.8 10.2a5 5 0 0 0-7.1 0l-2.3 2.3a5 5 0 0 0 7.1 7.1l1.3-1.3"/>',
  '<circle cx="12" cy="9" r="5.5"/><path d="M8.6 13.4 7.4 21l4.6-2.7 4.6 2.7-1.2-7.6"/>'
];

// ---- SEO ----

const absoluteUrl = useAbsoluteUrl();
usePageSeo(() => {
  const name = region.value ? bi(region.value.name) : "";
  const crumbs = [
    { "@type": "ListItem", position: 1, name: tx("Home"), item: absoluteUrl(localePath("/")) },
    { "@type": "ListItem", position: 2, name: c("name"), item: absoluteUrl(localePath("/press")) }
  ];
  if (region.value) crumbs.push({ "@type": "ListItem", position: 3, name, item: absoluteUrl(localePath(regionPath("press", region.value.slug))) });
  return {
    title: name ? c("seo.regionTitle").replace("{region}", name) : c("seo.title"),
    description: name ? c("seo.regionDescription").replace("{region}", name) : c("seo.description"),
    image: lead.value?.cover?.url,
    // 还没有任何内容的页面先不收录
    noindex: isEmpty.value,
    jsonLd: [{ "@type": "BreadcrumbList", itemListElement: crumbs }]
  };
});

// ---- 交互（移植自原页面脚本）：各板块的标题和卡片滚动到位后依次出现 ----

const cleanups: (() => void)[] = [];

onMounted(() => {
  if (!("IntersectionObserver" in window)) return;
  const groups = [
    ["#featured-press .section-head"],
    ["#featured-press .press-feature"],
    ["#featured-press .press-latest-head", "#featured-press .press-side-item"],
    ["#renter-stories .section-head"],
    ["#renter-stories .story-card"],
    ["#brand-moments .section-head"],
    ["#brand-moments .moment-item"]
  ];
  const timers: number[] = [];
  const io = new IntersectionObserver(
    entries =>
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const target = entry.target as HTMLElement;
        target.classList.add("in");
        // 出场结束后清掉延迟，否则之后的悬停过渡也会跟着延迟
        timers.push(window.setTimeout(() => (target.style.transitionDelay = ""), 1400));
        io.unobserve(target);
      }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.documentElement.classList.add("motion");
  const targets: HTMLElement[] = [];
  groups.forEach(selectors => {
    let index = 0;
    selectors.forEach(selector =>
      document.querySelectorAll<HTMLElement>(`.pg-press ${selector}`).forEach(element => {
        element.classList.add("rv");
        element.style.transitionDelay = `${index * 0.09}s`;
        index += 1;
        targets.push(element);
      })
    );
  });
  // 先让隐藏状态绘制出来，否则加载时已在视口内的元素会直接跳到终态，没有过渡
  void document.documentElement.offsetHeight;
  const frame = requestAnimationFrame(() => requestAnimationFrame(() => targets.forEach(element => io.observe(element))));
  cleanups.push(() => {
    cancelAnimationFrame(frame);
    timers.forEach(timer => clearTimeout(timer));
    io.disconnect();
    document.documentElement.classList.remove("motion");
  });
});

onBeforeUnmount(() => cleanups.splice(0).forEach(cleanup => cleanup()));
</script>
