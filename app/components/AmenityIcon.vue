<template>
  <!-- 设施插画：48×48 的矢量线稿，单色品牌粉线稿，纯装饰所以对读屏隐藏 -->
  <svg class="amenity-icon" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <template v-if="kind === 'fitness'">
      <path d="M12 24h24" />
      <rect x="6" y="16" width="6" height="16" rx="2" />
      <rect x="36" y="16" width="6" height="16" rx="2" />
      <path d="M2 21v6M46 21v6" class="accent" />
    </template>
    <template v-else-if="kind === 'cowork'">
      <rect x="9" y="11" width="30" height="20" rx="2.5" />
      <path d="M4 37h40l-3 -6H7z" />
      <circle cx="24" cy="21" r="3" class="accent" />
    </template>
    <template v-else-if="kind === 'rooftop'">
      <circle cx="35" cy="12" r="5" class="accent" />
      <path d="M5 41h38" />
      <path d="M9 41V27h30v14" />
      <path d="M9 27l3-6h24l3 6" />
      <path d="M17 27v14M24 27v14M31 27v14" />
    </template>
    <template v-else-if="kind === 'pool'">
      <path d="M16 31V12a4 4 0 0 1 8 0M30 31V12a4 4 0 0 1 8 0" />
      <path d="M16 20h14" />
      <path d="M4 36c3 0 3 3 6.5 3S14 36 17 36s3 3 7 3 3.5-3 7-3 3 3 6.5 3 3-3 6.5-3" class="accent" />
    </template>
    <template v-else-if="kind === 'doorman'">
      <circle cx="24" cy="23" r="6" />
      <path d="M18 18a6 6 0 0 1 12 0" />
      <path d="M15 18h18" class="accent" />
      <path d="M9 43c0-8 6-12 15-12s15 4 15 12z" />
      <path d="M21 32l3 3 3-3" class="accent" />
    </template>
    <template v-else-if="kind === 'concierge'">
      <path d="M8 34a16 16 0 0 1 32 0z" />
      <path d="M4 38h40" />
      <path d="M24 14v4" class="accent" />
      <circle cx="24" cy="11" r="2.5" />
    </template>
    <template v-else-if="kind === 'parking'">
      <rect x="7" y="7" width="34" height="34" rx="6" />
      <path d="M19 34V15h8a6 6 0 0 1 0 12h-8" class="accent" />
    </template>
    <template v-else-if="kind === 'laundry'">
      <rect x="8" y="5" width="32" height="38" rx="4" />
      <path d="M8 14h32" />
      <circle cx="24" cy="29" r="9" />
      <path d="M18.5 29c2 -2.5 3.5 2.5 6 0s3.5 -2 5.5 0" class="accent" />
      <path d="M14 9.5h.01M19 9.5h.01" />
    </template>
    <template v-else-if="kind === 'pet'">
      <ellipse cx="24" cy="32" rx="9" ry="7" />
      <circle cx="12" cy="22" r="3.5" class="accent" />
      <circle cx="20" cy="14" r="3.5" class="accent" />
      <circle cx="28" cy="14" r="3.5" class="accent" />
      <circle cx="36" cy="22" r="3.5" class="accent" />
    </template>
    <template v-else-if="kind === 'package'">
      <path d="M24 5l17 8v22l-17 8-17-8V13z" />
      <path d="M7 13l17 8 17-8M24 21v22" />
      <path d="M15.5 9l17 8" class="accent" />
    </template>
    <template v-else-if="kind === 'lounge'">
      <path d="M10 22v-6a5 5 0 0 1 5-5h18a5 5 0 0 1 5 5v6" />
      <path d="M6 24a4 4 0 0 1 8 0v6h20v-6a4 4 0 0 1 8 0v10H6z" />
      <path d="M12 34v5M36 34v5" class="accent" />
    </template>
    <template v-else-if="kind === 'game'">
      <rect x="4" y="14" width="40" height="22" rx="8" />
      <path d="M15 21v8M11 25h8" />
      <circle cx="31" cy="22" r="1.6" class="accent" />
      <circle cx="36" cy="27" r="1.6" class="accent" />
    </template>
    <template v-else-if="kind === 'sport'">
      <circle cx="24" cy="24" r="18" />
      <path d="M6 24h36M24 6v36" />
      <path d="M11 11c6 6 6 20 0 26M37 11c-6 6-6 20 0 26" class="accent" />
    </template>
    <template v-else>
      <path d="M24 6l5.5 12.5L42 24l-12.5 5.5L24 42l-5.5-12.5L6 24l12.5-5.5z" />
      <circle cx="24" cy="24" r="2.5" class="accent" />
    </template>
  </svg>
</template>

<script setup lang="ts">
/** 按设施名称里的关键词挑插画（中英文都认）；认不出来的用通用图案。名称本身来自 CMS 或临时资料，这里只负责配图。 */
const props = defineProps<{ label: string }>();

const RULES: [string, RegExp][] = [
  ["fitness", /fitness|gym|workout|健身|运动/i],
  ["cowork", /cowork|co-work|business|office|办公|商务/i],
  ["rooftop", /roof|terrace|deck|屋顶|露台|天台/i],
  ["game", /game|arcade|ping-?pong|billiard|游戏/i],
  ["sport", /basketball|golf|simulator|yoga|wellness|court|瑜伽|篮球|高尔夫|模拟器/i],
  ["pool", /pool|spa|sauna|泳池|游泳|桑拿/i],
  ["doorman", /doorman|门卫/i],
  ["concierge", /concierge|front desk|礼宾|前台/i],
  ["parking", /parking|garage|停车|车库/i],
  ["laundry", /laundry|washer|洗衣/i],
  ["pet", /pet|dog|宠物/i],
  ["package", /package|parcel|mail|包裹|快递/i],
  ["lounge", /lounge|club|living room|休息室|会所|公共客厅/i]
];

const kind = computed(() => RULES.find(([, pattern]) => pattern.test(props.label))?.[0] ?? "default");
</script>

<style scoped>
/* 单色线稿：整套图标统一用品牌粉色，不再区分点缀线 */
.amenity-icon {
  color: var(--pink);
}
</style>
