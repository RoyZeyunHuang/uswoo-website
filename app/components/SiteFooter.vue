<template>
  <footer>
    <div class="wrap">
      <div class="footer-top">
        <div v-if="on('footer.newsletter')" class="footer-col">
          <div class="ft-label">{{ c("footer.newsletterLabel") }}</div>
          <form class="newsletter-form" @submit.prevent>
            <input type="email" :placeholder="tx('Email address')" :aria-label="tx('Email address')" />
            <button type="submit" :aria-label="tx('Subscribe')">→</button>
          </form>
        </div>
        <div v-if="on('footer.follow') && list('footer.social').length" class="footer-col">
          <div class="ft-label">{{ c("footer.followLabel") }}</div>
          <ul class="footer-links">
            <li v-for="i in list('footer.social')" :key="i">
              <a :href="raw<string>(`footer.social.${i}.url`)" target="_blank" rel="noopener noreferrer">{{ c(`footer.social.${i}.label`) }} →</a>
            </li>
          </ul>
        </div>
      </div>

      <!-- 办公室、旗下平台、留学生网、二维码：每一组和组里的每一项都可以在 CMS 里单独开关，全部关闭时这一行不出现 -->
      <div v-if="offices.length || linkGroups.length || qrcode" class="footer-more">
        <div v-if="offices.length" class="footer-col footer-offices">
          <div class="ft-label">{{ c("footer.offices.title") }}</div>
          <div v-for="i in offices" :key="i" class="footer-office">
            <div class="footer-office-name">{{ c(`footer.offices.items.${i}.name`) }}</div>
            <div v-if="c(`footer.offices.items.${i}.address`)">{{ c(`footer.offices.items.${i}.address`) }}</div>
            <a v-if="raw<string>(`footer.offices.items.${i}.phone`)" :href="`tel:${String(raw<string>(`footer.offices.items.${i}.phone`)).replace(/[^+\d]/g, '')}`">
              {{ raw<string>(`footer.offices.items.${i}.phone`) }}
            </a>
            <a v-if="raw<string>(`footer.offices.items.${i}.email`)" :href="`mailto:${raw<string>(`footer.offices.items.${i}.email`)}`">
              {{ raw<string>(`footer.offices.items.${i}.email`) }}
            </a>
          </div>
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

const offices = computed(() => shown("footer.offices"));
const linkGroups = computed(() => ["footer.platforms", "footer.network"].map(path => ({ path, items: shown(path) })).filter(group => group.items.length));
const qrcode = computed(() => on("footer.qrcode") && Boolean(img("footer.qrcode.image")));
</script>
