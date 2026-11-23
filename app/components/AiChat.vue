<template>
  <div v-if="on('aiChat')" class="ai-chat" :class="{ open }">
    <section v-show="open" id="ai-chat-panel" class="ai-panel" role="dialog" :aria-label="c('aiChat.title')">
      <header class="ai-head">
        <span class="ai-avatar" aria-hidden="true">AI</span>
        <div class="ai-head-text">
          <strong>{{ c("aiChat.title") }}</strong>
          <small>{{ c("aiChat.subtitle") }}</small>
        </div>
        <button type="button" class="ai-close" :aria-label="tx('Close')" @click="open = false">×</button>
      </header>

      <div ref="bodyEl" class="ai-body">
        <div class="ai-msg bot">{{ c("aiChat.greeting") }}</div>
        <div v-for="(m, i) in messages" :key="i" class="ai-msg" :class="m.role">{{ m.role === "bot" ? c("aiChat.reply") : m.text }}</div>
        <div v-if="!messages.length" class="ai-chips">
          <button v-for="i in list('aiChat.quick')" :key="i" type="button" @click="send(plain(`aiChat.quick.${i}`))">{{ c(`aiChat.quick.${i}`) }}</button>
        </div>
      </div>

      <form class="ai-form" @submit.prevent="send(draft)">
        <input v-model="draft" type="text" :placeholder="tx('Type your question…')" :aria-label="tx('Type your question…')" autocomplete="off" />
        <button type="submit" :aria-label="tx('Send')" :disabled="!draft.trim()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
        </button>
      </form>
    </section>

    <button type="button" class="ai-fab" :aria-expanded="open" aria-controls="ai-chat-panel" :aria-label="c('aiChat.button')" @click="open = !open">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
      </svg>
      <span>{{ c("aiChat.button") }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import "~/assets/css/ai-chat.css";

/**
 * 右下角 AI 助手悬浮窗。目前只有界面：还没有接后端的对话接口，
 * 访客发出问题后先提示留下联系方式，由顾问跟进。接口就绪后把 reply() 换成真实请求即可。
 * 浮窗里的文案在 CMS「全站通用」的 aiChat 里，可以在那里整体隐藏（aiChat.show）。
 */
const { tx, isZh } = useTx();
const { c, raw, list, on } = await useSite({ global: true });
/** 快捷问题当作访客发出的消息时用原文（不带编辑预览的标记） */
const plain = (path: string) => {
  const leaf = raw<{ en?: string; zh?: string } | string>(path);
  return typeof leaf === "string" ? leaf : ((isZh.value ? leaf?.zh || leaf?.en : leaf?.en || leaf?.zh) ?? "");
};
const open = ref(false);
const draft = ref("");
const bodyEl = ref<HTMLElement>();
// 开场白之后的对话：访客的问题原样记下；助手的回复目前是 CMS 里固定的一句（aiChat.reply），渲染时再取
const messages = ref<{ role: "bot" | "user"; text: string }[]>([]);

function send(text: string) {
  const value = text.trim();
  if (!value) return;
  messages.value.push({ role: "user", text: value });
  draft.value = "";
  messages.value.push({ role: "bot", text: "" });
  nextTick(() => bodyEl.value?.scrollTo({ top: bodyEl.value.scrollHeight }));
}
</script>
