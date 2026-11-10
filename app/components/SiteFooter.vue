<template>
  <footer>
    <div class="wrap">
      <div class="footer-top">
        <div class="footer-col">
          <div class="ft-label">{{ tx("Stay in the Loop") }}</div>
          <form class="newsletter-form" @submit.prevent>
            <input type="email" :placeholder="tx('Email address')" :aria-label="tx('Email address')" />
            <button type="submit" :aria-label="tx('Subscribe')">→</button>
          </form>
        </div>
        <div class="footer-col">
          <div class="ft-label">{{ tx("Follow") }}</div>
          <ul class="footer-links">
            <li><a href="https://www.instagram.com/uswoo_realty/" target="_blank" rel="noopener noreferrer">Instagram →</a></li>
            <li><a href="https://www.linkedin.com/company/uswoo-realty-llc/home/" target="_blank" rel="noopener noreferrer">LinkedIn →</a></li>
            <li><a href="https://www.tiktok.com/@uswoo_realty" target="_blank" rel="noopener noreferrer">TikTok →</a></li>
          </ul>
        </div>
      </div>
      <p v-for="line in legal" :key="line" class="footer-legal">{{ tx(line) }}</p>
      <div class="footer-word">
        <div class="wm">USWOO</div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { tx } = useTx();

const legal = [
  "Boston USWOO Realty LLC is a licensed real estate broker in Massachusetts, with its New York branch, USWOO REALTY LLC, independently licensed in New York State.",
  "All information is deemed reliable but not guaranteed and is subject to change without notice. Listings are subject to prior sale, rental, or withdrawal.",
  "Both entities and their affiliates support Fair Housing and Equal Opportunity and comply with applicable anti-discrimination laws.",
  "Copyright ©2026 Boston USWOO Realty LLC. All Rights Reserved."
];
</script>
