<template>
  <div class="pg pg-article">
    <SiteHeader active="press" />

    <main id="top">
      <article class="story-article">
        <div class="story-narrow">
          <NuxtLink class="story-back" :to="{ path: localePath('/press'), hash: isStory ? '#renter-stories' : '#featured-press' }">
            {{ tx(isStory ? "← Back to Renter Stories" : "← Back to Press") }}
          </NuxtLink>
          <p class="eyebrow"><span class="idx">{{ isStory ? "02" : "01" }}</span> {{ typeLabel }}</p>
          <h1>{{ bi(post.title) }}</h1>
          <p v-if="bi(post.summary)" class="story-dek">{{ bi(post.summary) }}</p>
          <div v-if="meta.length" class="story-meta">
            <template v-for="(item, index) in meta" :key="index">
              <span v-if="index" class="dot" />
              <span>{{ item }}</span>
            </template>
          </div>
        </div>

        <div v-if="showCover" class="story-hero">
          <div class="story-hero-media">
            <SlotImage :src="post.cover?.url" :radius="18" :alt="bi(post.cover?.alt) || bi(post.title)" eager />
          </div>
        </div>

        <!-- 正文是 CMS 里编辑的 HTML，后端已按白名单清洗过 -->
        <div class="story-narrow story-body article-body" v-html="body" />
      </article>

      <section v-if="related.length" id="more-stories" class="more-stories">
        <div class="wrap">
          <div class="section-head">
            <p class="eyebrow">{{ tx("Keep reading") }}</p>
            <h2>{{ isStory ? tx("More renter stories.") : isZh ? "更多媒体报道" : "More press." }}</h2>
          </div>
          <div class="story-grid" :class="`cols-${Math.min(related.length, 3)}`">
            <component :is="item.externalUrl ? 'a' : NuxtLink" v-for="item in related" :key="item.id" class="media-card story-card" v-bind="linkAttrs(item)">
              <div class="media-card-media">
                <SlotImage :src="item.cover?.url" :radius="8" :alt="bi(item.cover?.alt) || bi(item.title)" />
              </div>
              <div class="media-card-body">
                <h3>{{ bi(item.title) }}</h3>
                <p v-if="bi(item.summary)">{{ bi(item.summary) }}</p>
                <div class="story-card-meta">
                  <template v-if="item.externalUrl && item.sourceName"><span class="src">{{ item.sourceName }}</span><span class="dot" /></template>
                  <span v-if="item.publishedAt">{{ formatDate(item.publishedAt) }}</span>
                  <span v-if="item.publishedAt && item.readMinutes" class="dot" />
                  <span v-if="item.readMinutes">{{ readTime(item.readMinutes) }}</span>
                </div>
              </div>
            </component>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import "~/assets/css/pages/article.css";
import { NuxtLink } from "#components";
import type { PostDetail, PostSummary } from "~~/shared/types/api";

const { tx, bi, isZh } = useTx();
const localePath = useLocalePath();
const props = defineProps<{ post: PostDetail; /** 草稿预览：不收录、不输出 canonical 以外的收录信息 */ preview?: boolean }>();
const post = computed(() => props.post);
const isStory = computed(() => post.value.type === "story");
const body = computed(() => bi(post.value.body));
const related = computed(() => post.value.related ?? []);

/** 栏目名：故事是「Renter Stories」；报道显示来源，没填来源就是自家公告 */
const typeLabel = computed(() => (isStory.value ? tx("Renter Stories") : post.value.sourceName || tx("USWOO Announcement")));

/** 正文以图片开头的文章自带题图（例如开头并排的两张现场照片），不再重复显示封面 */
const showCover = computed(() => Boolean(post.value.cover) && !/^\s*<figure[\s>]/i.test(body.value));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** 只取日期部分自己拼，避免服务端与浏览器时区不同导致差一天 */
function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return "";
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return isZh.value ? `${year}年${month}月${day}日` : `${MONTHS[month - 1]} ${day}, ${year}`;
}
function readTime(minutes: number): string {
  return isZh.value ? `${minutes} 分钟阅读` : `${minutes} min read`;
}

/** 标题下的一行：作者 · 日期 · 阅读时长（有什么显示什么） */
const meta = computed(() =>
  [post.value.author, post.value.publishedAt ? formatDate(post.value.publishedAt) : "", post.value.readMinutes ? readTime(post.value.readMinutes) : ""].filter(Boolean)
);

function linkAttrs(item: PostSummary): Record<string, string> {
  return item.externalUrl ? { href: item.externalUrl, target: "_blank", rel: "noopener" } : { to: localePath(`/press/${item.slug}`) };
}

// ---- SEO ----

const absoluteUrl = useAbsoluteUrl();
usePageSeo(() => {
  const item = post.value;
  const title = bi(item.seo?.title) || bi(item.title);
  const description = bi(item.seo?.description) || bi(item.summary);
  const image = item.seo?.image?.url || item.cover?.url || null;
  const url = absoluteUrl(localePath(`/press/${item.slug}`));
  const organization = { "@type": "Organization", name: "USWOO", url: absoluteUrl("/") };
  return {
    title: `${title} | USWOO`,
    description,
    image,
    ogType: "article",
    // 中文页但文章没有中文版：显示的是英文回退内容，不让搜索引擎收录
    canonicalPath: `/press/${item.slug}`,
    noindex: props.preview || (isZh.value && !(item.title?.zh && item.body?.zh)),
    jsonLd: [
      {
        "@type": item.type === "press" ? "NewsArticle" : "Article",
        headline: bi(item.title),
        ...(description ? { description } : {}),
        ...(item.publishedAt ? { datePublished: item.publishedAt } : {}),
        dateModified: item.updatedAt || item.publishedAt || undefined,
        ...(image ? { image: [absoluteUrl(image)] } : {}),
        inLanguage: isZh.value ? "zh-CN" : "en",
        author: organization,
        publisher: { ...organization, logo: { "@type": "ImageObject", url: absoluteUrl("/assets/uswoo-hero-poster.jpg") } },
        mainEntityOfPage: { "@type": "WebPage", "@id": url }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: isZh.value ? "首页" : "Home", item: absoluteUrl(localePath("/")) },
          { "@type": "ListItem", position: 2, name: tx("Press & Stories"), item: absoluteUrl(localePath("/press")) },
          { "@type": "ListItem", position: 3, name: bi(item.title), item: url }
        ]
      }
    ]
  };
});
</script>
