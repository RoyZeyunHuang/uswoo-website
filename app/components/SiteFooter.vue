<template>
  <footer>
    <div class="wrap">
      <!-- 订阅框、社交链接（Follow）、旗下平台、留学生网、二维码、办公室排在同一行，各栏平均撑满整行：每一组和组里的每一项都可以在 CMS 里单独开关，全部关闭时这一行不出现 -->
      <div v-if="newsletter || offices.length || linkGroups.length || qrcode || follow" class="footer-more">
        <div v-if="newsletter" class="footer-col footer-newsletter">
          <div class="ft-label">{{ c("footer.newsletterLabel") }}</div>
          <form class="newsletter-form" @submit.prevent>
            <input type="email" :placeholder="tx('Email address')" :aria-label="tx('Email address')" />
            <button type="submit" :aria-label="tx('Subscribe')">→</button>
          </form>
        </div>
        <div v-if="follow" class="footer-col footer-follow">
          <div class="ft-label">{{ c("footer.followLabel") }}</div>
          <ul class="footer-links">
            <li v-for="i in list('footer.social')" :key="i">
              <a :href="raw<string>(`footer.social.${i}.url`)" target="_blank" rel="noopener noreferrer">{{ c(`footer.social.${i}.label`) }} →</a>
            </li>
          </ul>
        </div>
        <div v-for="group in linkGroups" :key="group.path" class="footer-col">
          <div class="ft-label">{{ c(`${group.path}.title`) }}</div>
          <ul class="footer-links">
            <li v-for="i in group.items" :key="i">
              <a :href="raw<string>(`${group.path}.items.${i}.url`)" target="_blank" rel="noopener noreferrer">{{ c(`${group.path}.items.${i}.name`) }}</a>
            </li>
          </ul>
        </div>
        <div v-if="qrcode" class="footer-col footer-qr">
          <div class="ft-label">{{ c("footer.qrcode.title") }}</div>
          <img :src="img('footer.qrcode.image')" :alt="c('footer.qrcode.title')" loading="lazy" width="96" height="96" />
        </div>

        <!-- 每个办公室单独一栏，标题只放在第一栏上方；其余栏用空标题占位，让几栏顶部对齐 -->
        <div v-for="(i, index) in offices" :key="i" class="footer-col footer-office">
          <div class="ft-label" :class="{ blank: index > 0 }">{{ index === 0 ? c("footer.offices.title") : "\u00a0" }}</div>
          <div class="footer-office-name">{{ c(`footer.offices.items.${i}.name`) }}</div>
          <div v-if="c(`footer.offices.items.${i}.address`)" class="footer-office-addr">
            <span v-for="(line, n) in addressLines(c(`footer.offices.items.${i}.address`))" :key="n">{{ line }}</span>
          </div>
          <a v-if="raw<string>(`footer.offices.items.${i}.phone`)" :href="`tel:${String(raw<string>(`footer.offices.items.${i}.phone`)).replace(/[^+\d]/g, '')}`">
            {{ raw<string>(`footer.offices.items.${i}.phone`) }}
          </a>
          <a v-if="raw<string>(`footer.offices.items.${i}.email`)" :href="`mailto:${raw<string>(`footer.offices.items.${i}.email`)}`">
            {{ raw<string>(`footer.offices.items.${i}.email`) }}
          </a>
        </div>
      </div>

      <p v-for="i in list('footer.legal')" :key="i" class="footer-legal">{{ c(`footer.legal.${i}`) }}</p>
      <div class="footer-word">
        <div class="wm">{{ c("brand.wordmark") }}</div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
/**
 * 页脚。内容与每一块是否展示都来自 CMS「新官网页面 → 全站通用」的 footer：
 * 订阅框、社交链接、办公室、旗下平台、留学生网、二维码各有 show 开关，列表里的每一项也有自己的 show。
 */
const { tx } = useTx();
const { c, raw, img, list } = await useSite();

/** 开关没填时视为展示，只有明确设为 false 才隐藏 */
const on = (path: string) => raw<boolean>(`${path}.show`) !== false;
/** 一组里处于展示状态的条目下标；整组关闭时为空 */
const shown = (path: string) => (on(path) ? list(`${path}.items`).filter(i => on(`${path}.items.${i}`)) : []);

/** 地址分行：CMS 里写了换行就按它分；没写时，带楼层 / 套房号的地址在号码后面断开（街道一行，城市州邮编一行），其余保持一行 */
const addressLines = (text: string): string[] => {
  const manual = text.split(/\r?\n/).filter(Boolean);
  if (manual.length > 1) return manual;
  const match = /^(.*?\b(?:Suite|Ste\.?|Floor|Fl\.?|Unit|Apt\.?|#)\s*\w+),\s*(.+)$/i.exec(text);
  return match ? [`${match[1]},`, match[2]!] : [text];
};

const offices = computed(() => shown("footer.offices"));
const linkGroups = computed(() => ["footer.platforms", "footer.network"].map(path => ({ path, items: shown(path) })).filter(group => group.items.length));
const newsletter = computed(() => on("footer.newsletter"));
const follow = computed(() => on("footer.follow") && list("footer.social").length > 0);
const qrcode = computed(() => on("footer.qrcode") && Boolean(img("footer.qrcode.image")));
</script>
