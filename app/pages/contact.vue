<template>
  <div class="pg pg-contact">
    <SiteHeader :scrolled="true" />

    <main id="top">
      <section class="contact">
        <div class="contact-photo"><img :src="img('hero.image')" alt="" /></div>
        <div class="contact-pane">
          <div class="contact-top">
            <!-- 标题后半截是粉色的，拆成两段文字（英文两段之间有空格，中文没有） -->
            <h1>
              {{ c("hero.titleLead") + (isZh ? "" : " ") }}<span class="pink">{{ c("hero.titleAccent") }}</span>
            </h1>
            <p>{{ c("hero.text") }}</p>
          </div>
          <!-- novalidate：校验提示由页面自己给出，中英文一致，不用浏览器自带的气泡 -->
          <form id="contactForm" class="contact-form" novalidate @submit.prevent="submit">
            <div class="field">
              <label for="cf-name">{{ c("form.nameLabel") }}</label>
              <input id="cf-name" v-model="form.name" name="name" type="text" :placeholder="c('form.namePlaceholder')" required maxlength="100" autocomplete="name" />
            </div>
            <div class="field">
              <label for="cf-email">{{ c("form.emailLabel") }}</label>
              <input id="cf-email" v-model="form.email" name="email" type="email" :placeholder="c('form.emailPlaceholder')" required maxlength="200" autocomplete="email" />
            </div>
            <div class="field">
              <label for="cf-message">{{ c("form.messageLabel") }}</label>
              <textarea id="cf-message" v-model="form.message" name="message" :placeholder="c('form.messagePlaceholder')" required :maxlength="MESSAGE_MAX" />
            </div>
            <!-- 蜜罐：真人看不到也不会填，自动填表的程序会填 -->
            <input v-model="form.website" class="cf-website" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
            <div class="submit-row">
              <button class="btn btn-pink" type="submit" style="border: 0" :disabled="sending">
                <template v-if="sending">{{ tx("Sending…") }}</template>
                <!-- 箭头只在英文按钮上有（设计稿如此） -->
                <template v-else-if="isZh">{{ c("form.submit") }}</template>
                <template v-else>{{ c("form.submit") }} <span aria-hidden="true">→</span></template>
              </button>
            </div>
            <p v-if="status === 'sent'" class="form-msg show is-success" role="status">
              {{ tx("Thank you — your message has been sent. Our team will get back to you within two business days.") }}
            </p>
            <p v-else-if="status === 'error'" class="form-msg show is-error" role="alert">
              {{ errorText }}
              <template v-if="showMailFallback">
                {{ tx("You can also write to") }} <a :href="`mailto:${contactEmail}`">{{ contactEmail }}</a>{{ tx(".") }}
              </template>
            </p>
          </form>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import "~/assets/css/pages/contact.css";
import "~/assets/css/pages/contact.extra.css";
import type { LeadInput } from "~~/shared/types/api";

const { tx, isZh } = useTx();
const localePath = useLocalePath();
const route = useRoute();
const config = useRuntimeConfig();
const api = useApi();
const { c, img, raw } = await usePageContent("contact");
/** 接口出错时给出的备用联系邮箱 */
const contactEmail = computed(() => raw<string>("email"));

const absoluteUrl = useAbsoluteUrl();
usePageSeo(() => ({
  title: c("seo.title"),
  description: c("seo.description"),
  keywords: c("seo.keywords"),
  image: img("hero.image"),
  jsonLd: [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: tx("Home"), item: absoluteUrl(localePath("/")) },
        { "@type": "ListItem", position: 2, name: c("seo.breadcrumb"), item: absoluteUrl(localePath("/contact")) }
      ]
    }
  ]
}));

// ---- 留言表单：原站是打开邮件客户端（mailto），这里改为提交到线索接口 ----

const MESSAGE_MAX = 5000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const form = reactive({ name: "", email: "", message: "", website: "" });
const sending = ref(false);
const status = ref<"idle" | "sent" | "error">("idle");
/** 错误类型存代号而不是文字，切换语言后提示跟着变 */
const errorKind = ref<"name" | "email" | "message" | "tooLong" | "rate" | "server">("server");

const errorText = computed(() => {
  switch (errorKind.value) {
    case "name":
      return tx("Please enter your name.");
    case "email":
      return tx("Please enter a valid email address.");
    case "message":
      return tx("Please tell us how we can help.");
    case "tooLong":
      return tx("Your message is too long (max {max} characters).").replace("{max}", String(MESSAGE_MAX));
    case "rate":
      return tx("Too many submissions, please try again later.");
    default:
      return tx("Something went wrong and your message was not sent. Please try again.");
  }
});
/** 接口出错（而不是填写有误）时，给出邮箱作为备用联系方式 */
const showMailFallback = computed(() => errorKind.value === "server" || errorKind.value === "rate");

/** 从房源详情页点「咨询」过来时带着房源编号和地区：预填一句留言，提交时带上地区，方便分给对应地区的同事 */
const leadRegion = ref("");
onMounted(() => {
  const region = String(route.query.region ?? "");
  if (/^[a-z-]{1,40}$/.test(region)) leadRegion.value = region;
  const listing = String(route.query.listing ?? "");
  if (/^\d{1,12}$/.test(listing) && !form.message) {
    const link = absoluteUrl(`/listings/${listing}`);
    form.message = tx("Hi, I'd like to ask about this listing: {link}").replace("{link}", link) + "\n";
  }
});

function validate(): typeof errorKind.value | null {
  if (!form.name.trim()) return "name";
  if (!EMAIL.test(form.email.trim())) return "email";
  if (!form.message.trim()) return "message";
  if (form.message.trim().length > MESSAGE_MAX) return "tooLong";
  return null;
}

async function submit() {
  if (sending.value) return;
  const invalid = validate();
  if (invalid) {
    errorKind.value = invalid;
    status.value = "error";
    return;
  }

  const lead: LeadInput = {
    name: form.name.trim(),
    email: form.email.trim(),
    message: form.message.trim(),
    // 设计稿的表单没有“咨询类型”一项，统一按租客咨询提交
    type: "renter",
    ...(leadRegion.value ? { region: leadRegion.value } : {}),
    sourcePath: route.path,
    sourceEnv: config.public.deployEnv === "production" ? "production" : "staging",
    locale: isZh.value ? "zh" : "en",
    website: form.website
  };

  sending.value = true;
  status.value = "idle";
  try {
    await api<unknown>("/leads", { method: "POST", body: { ...lead } });
    status.value = "sent";
    form.name = "";
    form.email = "";
    form.message = "";
  } catch (error) {
    errorKind.value = error instanceof ApiError && error.status === 429 ? "rate" : "server";
    status.value = "error";
  } finally {
    sending.value = false;
  }
}
</script>
