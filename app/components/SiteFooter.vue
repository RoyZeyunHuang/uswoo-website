<template>
  <footer>
    <div class="wrap">
      <div class="footer-top">
        <div class="footer-col">
          <div class="ft-label">{{ c("footer.newsletterLabel") }}</div>
          <form class="newsletter-form" @submit.prevent>
            <input type="email" :placeholder="tx('Email address')" :aria-label="tx('Email address')" />
            <button type="submit" :aria-label="tx('Subscribe')">→</button>
          </form>
        </div>
        <div class="footer-col">
          <div class="ft-label">{{ c("footer.followLabel") }}</div>
          <ul class="footer-links">
            <li v-for="i in list('footer.social')" :key="i">
              <a :href="raw<string>(`footer.social.${i}.url`)" target="_blank" rel="noopener noreferrer">{{ c(`footer.social.${i}.label`) }} →</a>
            </li>
          </ul>
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
/** 页脚。内容来自 CMS「新官网页面 → 全站通用」。 */
const { tx } = useTx();
const { c, raw, list } = await useSite();
</script>
