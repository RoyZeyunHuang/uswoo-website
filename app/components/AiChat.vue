<template>
  <div class="ai-chat" :class="{ open }">
    <section v-show="open" id="ai-chat-panel" class="ai-panel" role="dialog" :aria-label="tx('USWOO AI assistant')">
      <header class="ai-head">
        <span class="ai-avatar" aria-hidden="true">AI</span>
        <div class="ai-head-text">
          <strong>{{ tx("USWOO AI assistant") }}</strong>
          <small>{{ tx("Ask about listings, areas and renting") }}</small>
        </div>
        <button type="button" class="ai-close" :aria-label="tx('Close')" @click="open = false">×</button>
      </header>

      <div ref="bodyEl" class="ai-body">
        <div v-for="(m, i) in messages" :key="i" class="ai-msg" :class="m.role">{{ m.text }}</div>
        <div v-if="messages.length === 1" class="ai-chips">
          <button v-for="q in quick" :key="q" type="button" @click="send(q)">{{ q }}</button>
        </div>
      </div>

      <form class="ai-form" @submit.prevent="send(draft)">
        <input v-model="draft" type="text" :placeholder="tx('Type your question…')" :aria-label="tx('Type your question…')" autocomplete="off" />
        <button type="submit" :aria-label="tx('Send')" :disabled="!draft.trim()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
        </button>
      </form>
    </section>

    <button type="button" class="ai-fab" :aria-expanded="open" aria-controls="ai-chat-panel" :aria-label="tx('Ask AI')" @click="open = !open">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
      </svg>
      <span>{{ tx("Ask AI") }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import "~/assets/css/ai-chat.css";

/**
 * 右下角 AI 助手悬浮窗。目前只有界面：还没有接后端的对话接口，
 * 访客发出问题后先提示留下联系方式，由顾问跟进。接口就绪后把 reply() 换成真实请求即可。
 * 弹窗里的文字是临时写在界面文字里的，之后应迁到 CMS。
 */
const { tx } = useTx();
const open = ref(false);
const draft = ref("");
const bodyEl = ref<HTMLElement>();
const messages = ref<{ role: "bot" | "user"; text: string }[]>([{ role: "bot", text: tx("Hi! I'm the USWOO assistant. What are you looking for?") }]);
const quick = computed(() => [tx("Find a rental"), tx("Rental process"), tx("Talk to an advisor")]);

function send(text: string) {
  const value = text.trim();
  if (!value) return;
  messages.value.push({ role: "user", text: value });
  draft.value = "";
  messages.value.push({ role: "bot", text: tx("Our AI assistant is still being set up. Please leave your details on the Contact page and an advisor will get back to you.") });
  nextTick(() => bodyEl.value?.scrollTo({ top: bodyEl.value.scrollHeight }));
}
</script>
