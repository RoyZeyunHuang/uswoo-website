<template>
  <div class="pg pg-listings">
    <SiteHeader active="listings" scrolled />

    <main id="top">
      <!-- 首屏只保留大标题：不放小标题、说明文字和城市筛选 -->
      <section v-if="on('hero')" class="ls-hero">
        <div class="wrap">
          <h1>
            {{ c("hero.titleLead") }}<template v-if="!isZh">{{ " " }}</template
            ><span class="pink">{{ c("hero.titleAccent") }}</span>
          </h1>
        </div>
      </section>

      <section class="ls-grid-sec">
        <div class="wrap">
          <!-- 独家楼盘：内容在 CMS 的 buildings 里；「全部」页显示所有，地区页只显示该地区的 -->
          <div v-if="buildings.length" class="ls-dev">
            <p class="eyebrow">{{ c("buildings.eyebrow") }}</p>
            <div class="ls-dev-grid">
              <NuxtLink v-for="item in buildings" :key="item.slug" class="ls-dev-card" :to="localePath(`/listings/building/${item.slug}`)">
                <div class="ls-dev-media">
                  <img v-if="img(`${item.path}.image`)" :src="img(`${item.path}.image`)" :alt="c(`${item.path}.name`)" :style="item.position ? { objectPosition: item.position } : undefined" loading="lazy" />
                  <span v-else class="ls-dev-ph" aria-hidden="true">{{ c(`${item.path}.name`) }}</span>
                  <span v-if="c(`${item.path}.tag`)" class="ls-tag">{{ c(`${item.path}.tag`) }}</span>
                </div>
                <div class="ls-dev-body">
                  <div>
                    <h3>{{ c(`${item.path}.name`) }}</h3>
                    <p>{{ c(`${item.path}.state`) || regionLabel(item.region) }}</p>
                  </div>
                  <span class="ls-dev-cta">{{ c("buildings.cardCta") }} <span aria-hidden="true">→</span></span>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- 列表页只展示合作的大楼 / 开发商；具体房源在点进楼盘之后 -->
          <p v-if="!buildings.length" id="lsEmpty" class="ls-empty" style="display: block">{{ c("empty") }}</p>
          <p class="ls-note">{{ c("disclaimer") }}</p>
        </div>
      </section>

      <section v-if="on('cta')" class="band-raised cta-band">
        <div class="wrap">
          <p class="eyebrow"><span class="idx">{{ no("cta") }}</span> {{ c("cta.eyebrow") }}</p>
          <h2>{{ c("cta.title") }}</h2>
          <p class="lede">
            {{ c("cta.lede") }}
          </p>
          <div class="btn-row">
            <NuxtLink class="btn btn-pink" :to="localePath(regionPath('contact', props.region))">{{ c("cta.button") }}</NuxtLink>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import "~/assets/css/pages/listings.css";
import "~/assets/css/pages/listings.extra.css";

/** 房源列表：/listings（全部地区）与 /{region}/listings（单个地区）共用。 */
const props = defineProps<{ region?: string }>();

const { region, regions } = await useRegion(props.region);
const { tx, bi, isZh } = useTx();
const localePath = useLocalePath();
const absoluteUrl = useAbsoluteUrl();
// 页面上的固定文案：地区页用该地区的版本（没有单独配置的部分沿用全站默认）
const { c, img, on } = await usePageContent("listings", props.region);
const no = useBlockNumbers(["cta"] as const, on);

// 独家楼盘：可以在 CMS 里整体隐藏（buildings.show）；「全部」页显示所有，地区页只显示该地区的
const allBuildings = await useBuildings(props.region);
const buildings = computed(() => (on("buildings") ? allBuildings.value.filter(item => !props.region || item.region === props.region) : []));
const regionLabel = (slug: string) => {
  const item = regions.value.find(entry => entry.slug === slug);
  return item ? bi(item.name) : "";
};

usePageSeo(() => {
  const name = region.value ? bi(region.value.name) : "";
  const path = regionPath("listings", region.value?.slug);
  const crumbs = [
    { "@type": "ListItem", position: 1, name: tx("Home"), item: absoluteUrl(localePath("/")) },
    { "@type": "ListItem", position: 2, name: c("name"), item: absoluteUrl(localePath("/listings")) }
  ];
  if (region.value) crumbs.push({ "@type": "ListItem", position: 3, name, item: absoluteUrl(localePath(path)) });

  const jsonLd: Record<string, unknown>[] = [{ "@type": "BreadcrumbList", itemListElement: crumbs }];

  return {
    title: region.value ? c("seo.regionTitle").replace("{region}", name) : c("seo.title"),
    description: region.value ? c("seo.regionDescription").replace("{region}", name) : c("seo.description"),
    keywords: c("seo.keywords"),
    // 还没有房源的地区页只有一句占位说明，不让搜索引擎收录
    noindex: Boolean(region.value) && !buildings.value.length,
    jsonLd
  };
});
</script>
