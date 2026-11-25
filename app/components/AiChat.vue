<template>
  <div v-if="on('aiChat')" class="ai-chat" :class="{ open }">
    <section v-show="open" id="ai-chat-panel" class="ai-panel" :class="{ expanded }" role="dialog" :aria-label="c('aiChat.title')" @keydown.esc="closePanel">
      <header class="ai-head">
        <span class="ai-avatar" aria-hidden="true">AI</span>
        <div class="ai-head-text">
          <strong>{{ c("aiChat.title") }}</strong>
          <small>{{ c("aiChat.subtitle") }}</small>
        </div>
        <button type="button" class="ai-icon-btn" :aria-label="tx('Start over')" :title="tx('Start over')" @click="reset">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" /></svg>
        </button>
        <button type="button" class="ai-icon-btn ai-expand" :aria-label="expanded ? tx('Shrink') : tx('Enlarge')" :title="expanded ? tx('Shrink') : tx('Enlarge')" :aria-pressed="expanded" @click="expanded = !expanded">
          <svg v-if="!expanded" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 10l7-7M21 8V3h-5M10 14l-7 7M3 16v5h5" /></svg>
        </button>
        <button type="button" class="ai-close" :aria-label="tx('Close')" @click="closePanel">×</button>
      </header>

      <div v-if="tags.length" class="ai-applied" role="group" :aria-label="tx('Your answers')">
        <span v-for="tag in tags" :key="tag.key" class="ai-tag">
          {{ tag.label }}
          <button type="button" :aria-label="`${tx('Remove')}: ${tag.label}`" @click="tag.remove()">×</button>
        </span>
      </div>

      <div ref="bodyEl" class="ai-body" aria-live="polite">
        <template v-for="(m, i) in view" :key="i">
          <template v-if="m.cards">
          <div class="ai-cards">
            <div class="ai-cards-head">
              <strong>{{ matches.length === 1 ? tx("1 building available") : fill(tx("{n} buildings available"), { n: String(matches.length) }) }}</strong>
              <span>
                <button type="button" class="ai-arrow prev" :aria-label="tx('Previous')" @click="slide(-1, $event)">‹</button>
                <button type="button" class="ai-arrow next" :aria-label="tx('Next')" @click="slide(1, $event)">›</button>
              </span>
            </div>
            <ul class="ai-rail">
              <li v-for="card in cards" :key="card.slug">
                <NuxtLink class="ai-card" :to="card.to">
                  <span class="ai-card-img"><img v-if="card.image" :src="card.image" :alt="card.name" loading="lazy" decoding="async" /></span>
                  <span class="ai-card-body">
                    <strong v-if="card.price">${{ money(card.price) }}+</strong>
                    <span class="ai-card-name">{{ card.name }}</span>
                    <span v-if="card.sub" class="ai-card-sub">{{ card.sub }}</span>
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </div>
          </template>
          <template v-else>
            <div class="ai-msg" :class="m.role"><p v-for="(blk, bi) in blocks(m.text)" :key="bi" :class="{ li: blk.li }"><template v-for="(sg, si) in blk.segs" :key="si"><NuxtLink v-if="sg.to" :to="sg.to">{{ sg.s }}</NuxtLink><strong v-else-if="sg.b">{{ sg.s }}</strong><template v-else>{{ sg.s }}</template></template></p></div>
            <small v-if="i === 0" class="ai-who">{{ tx("USWOO Assistant") }}</small>
          </template>
        </template>
        <div class="ai-quick" role="group" :aria-label="tx('Quick replies')">
          <button v-for="o in options" :key="o.key" type="button" :class="{ soft: o.soft }" @click="pick(o)">{{ o.label }}</button>
        </div>
      </div>

      <form class="ai-form" @submit.prevent="send(draft)">
        <input ref="inputEl" v-model="draft" type="text" maxlength="500" :placeholder="tx('Ask a question…')" :aria-label="tx('Ask a question…')" autocomplete="off" />
        <button type="submit" :aria-label="tx('Send')" :disabled="!draft.trim()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
        </button>
      </form>
      <p class="ai-note">{{ tx("AI can make mistakes. Please confirm details on the listing page or with an agent. Do not share SSN, passport or bank details here.") }}</p>
    </section>

    <button ref="fabEl" type="button" class="ai-fab" :aria-expanded="open" aria-controls="ai-chat-panel" :aria-label="c('aiChat.button')" @click="openPanel">
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
 * 右下角 AI 助手悬浮窗（第 1 阶段：只有界面，还没接对话接口）。
 * 对话是五步引导：城市 → 偏好户型 → 月租预算（预算档位按所选城市的楼盘起租价算）；每一步都给完整句子的选项（含"还没想好"，不会走进死路），
 * 答完后用 CMS 里的楼盘按城市和预算列出房源。自由输入的问题暂时只回一句固定的话（CMS 的 aiChat.reply），之后接口就绪再换成真实回复。
 * 开场白、引导问题和选项这类功能性文字用 tx()，中文暂不做；标题、按钮、固定回复在 CMS「全站通用」的 aiChat 里，可以在那里整体隐藏（aiChat.show）。
 * 模板里不写 HTML 注释：开发模式会保留注释节点，导致水合不一致。
 */
const { tx, bi } = useTx();
const { c, on } = await useSite({ global: true });
const regions = await useRegions();
const route = useRoute();
const localePath = useLocalePath();

// ——— 回答（结构化，由界面持有；以后原样发给接口）———
type BedKey = "studio" | "1" | "2" | "3+";
type StepKey = "city" | "beds" | "budget";
// 顺序：城市 → 偏好户型 → 预算。不问入住时间和同住的人（访客不愿填，楼盘数据里也没有逐户信息可用）
const STEPS: StepKey[] = ["city", "beds", "budget"];
const BEDS: BedKey[] = ["studio", "1", "2", "3+"];
const FALLBACK_BUDGETS = [2500, 3500, 5000]; // 该地区楼盘价格不够算分档时的兜底

interface Filters { city: string | null; beds: BedKey | null; budgetMax: number | null }
const emptyFilters = (): Filters => ({ city: null, beds: null, budgetMax: null });
const filters = ref<Filters>(emptyFilters());
/** 访客选了"还没想好"的步骤：算已回答，但不作为条件 */
const skipped = ref<StepKey[]>([]);


// 楼盘页上正在看的楼（由 BuildingView 写入）
const viewing = useState<{ slug: string; name: string } | null>("ai-chat-viewing", () => null);
const viewingOn = ref(true);
watch(viewing, () => (viewingOn.value = true));

// 不按页面预填城市：不管在哪个页面打开，开场都先问访客想住哪个城市

const money = (n: number) => n.toLocaleString("en-US");
const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? "");
const cityName = (slug: string) => bi(regions.value.find(item => item.slug === slug)?.name) || slug;
const bedLabel = (b: BedKey) => (b === "studio" ? tx("Studio") : b === "1" ? tx("1 bedroom") : b === "2" ? tx("2 bedrooms") : tx("3+ bedrooms"));
const answered = (k: StepKey) => skipped.value.includes(k) || (k === "budget" ? !!filters.value.budgetMax : !!filters.value[k]);
/** 当前要问的那一步；五步都答完为 null */
const step = computed<StepKey | null>(() => STEPS.find(k => !answered(k)) ?? null);

// 条件标签：点 × 取消某一项，对话会回到那一步重新问
interface Tag { key: string; label: string; remove: () => void }
const tags = computed<Tag[]>(() => {
  const f = filters.value;
  const out: Tag[] = [];
  if (viewing.value && viewingOn.value) out.push({ key: "viewing", label: fill(tx("Viewing: {name}"), { name: viewing.value.name }), remove: () => (viewingOn.value = false) });
  if (f.city) out.push({ key: "city", label: cityName(f.city), remove: () => unset("city") });
  if (f.beds) out.push({ key: "beds", label: bedLabel(f.beds), remove: () => unset("beds") });
  if (f.budgetMax) out.push({ key: "budget", label: fill(tx("Under ${amount}/mo"), { amount: money(f.budgetMax) }), remove: () => unset("budget") });
  return out;
});
/**
 * 取消某一项回答 = 回到那一步重新问：这一步和它之后的回答一起清掉，对话记录也退回到提问之前，
 * 这样问题永远按 城市 → 户型 → 月租 的顺序只问一遍，不会出现"问过又问"的重复。
 */
function unset(k: StepKey) {
  const from = STEPS.indexOf(k);
  const later = STEPS.slice(from);
  skipped.value = skipped.value.filter(x => !later.includes(x));
  askedTopics.value = [];
  messages.value = messages.value.filter(m => !m.cards);
  for (const s of later) {
    if (s === "budget") filters.value.budgetMax = null;
    else filters.value[s] = null;
  }
  const cut = messages.value.findIndex(m => m.step && later.includes(m.step));
  if (cut >= 0) messages.value = messages.value.slice(0, cut);
  // 第一个问题合在开场气泡里：退回到第一步时，开场气泡也恢复成"开场白 + 当前问题"
  if (from === 0) opening.value = null;
}

// ——— 房源（来自 CMS 楼盘列表）：按城市和月租预算过滤；房型 CMS 里没有逐户数据，暂不过滤，结果里说明 ———
const allBuildings = await useBuildings();
const { text: buildingText, cover, price: buildingPrice, maxBeds, amenityNames } = await useBuildingFields();
const matches = computed(() => {
  const f = filters.value;
  return buildingsFor(allBuildings.value, f.city ?? undefined).filter(item => !f.budgetMax || !buildingPrice(item) || buildingPrice(item) <= f.budgetMax);
});
const cards = computed(() =>
  matches.value.slice(0, 8).map(item => ({
    slug: item.slug,
    name: buildingText(item, "name"),
    price: buildingPrice(item),
    image: cover(item),
    sub: [...new Set(amenityNames(item).filter(Boolean))].slice(0, 3).join(" • ") || buildingText(item, "address") || cityName(item.region),
    to: localePath(`/listings/building/${item.slug}`)
  }))
);
/** 消息里的简单标记：**加粗**、[文字](站内路径) 链接、以"- "开头的行是列表项；不用 v-html，避免把楼盘名之类的内容当 HTML 输出 */
interface Seg { s: string; b?: boolean; to?: string }
function blocks(text: string): { li: boolean; segs: Seg[] }[] {
  return text.split("\n").filter(line => line.trim()).map(line => {
    const li = line.startsWith("- ");
    const body = li ? line.slice(2) : line;
    const segs: Seg[] = [];
    let last = 0;
    for (const m of body.matchAll(/\*\*(.+?)\*\*|\[(.+?)\]\((\/[^)\s]*)\)/g)) {
      if (m.index > last) segs.push({ s: body.slice(last, m.index) });
      segs.push(m[1] ? { s: m[1], b: true } : { s: m[2]!, to: m[3] });
      last = m.index + m[0].length;
    }
    if (last < body.length) segs.push({ s: body.slice(last) });
    return { li, segs };
  });
}
/** 卡片列表在 v-for 里（可能不止一处），所以从点到的按钮往上找它自己那一排 */
function slide(dir: number, e: Event) {
  (e.currentTarget as HTMLElement).closest(".ai-cards")?.querySelector<HTMLElement>(".ai-rail")?.scrollBy({ left: dir * 224, behavior: "smooth" });
}

// ——— 引导问题与选项：每个选项都是完整句子，点击时回答先生效 ———
/** ack：回答生效之后，助手接在回答下面的那句话（确认 + 数量/理由），然后才是下一个问题 */
interface Option { key: string; label: string; say?: string; soft?: boolean; apply: () => void; to?: string; ack?: () => string; /** 房源出来之后的追问：不属于五步之一，答完也照常追加助手的回答 */ topic?: string }
/** 预算档位和价格区间：按所选城市现有楼盘的起租价算，没有足够数据时用兜底档位 */
const priceStats = computed(() => {
  const prices = buildingsFor(allBuildings.value, filters.value.city ?? undefined).map(item => buildingPrice(item)).filter((p): p is number => !!p).sort((a, b) => a - b);
  if (prices.length < 3) return { min: 0, max: 0, tiers: FALLBACK_BUDGETS };
  const at = (q: number) => prices[Math.min(prices.length - 1, Math.floor(prices.length * q))]!;
  const up = (n: number) => Math.ceil(n / 500) * 500;
  const tiers = [...new Set([up(at(0.34)), up(at(0.67)), up(prices[prices.length - 1]!)])];
  return { min: prices[0]!, max: prices[prices.length - 1]!, tiers };
});
const prompt = computed(() => {
  const f = filters.value;
  if (step.value === "city") return tx("Which city are you looking to live in?");
  if (step.value === "beds") return tx("What size of home do you prefer?");
  if (step.value === "budget") {
    const { min, max } = priceStats.value;
    const ask = tx("What's your monthly budget?");
    return min ? `${fill(tx("Starting rents here range from about ${min} to ${max} a month."), { min: money(min), max: money(max) })} ${ask}` : ask;
  }
  if (!matches.value.length) return tx("I couldn't find a building that matches all of that. Want to loosen one of your answers?");
  if (askedTopics.value.length) return "";
  const prices = matches.value.map(item => buildingPrice(item)).filter(Boolean).sort((x, y) => x - y);
  const lead = f.budgetMax ? fill(tx("Nice — under ${amount} a month keeps {n} buildings on the table in {city}"), { amount: money(f.budgetMax), n: String(matches.value.length), city: f.city ? cityName(f.city) : "" }) : fill(tx("Got it — here are {n} buildings in {city}"), { n: String(matches.value.length), city: f.city ? cityName(f.city) : "" });
  const range = prices.length > 1 ? fill(tx(", with starting rents from about ${min} to ${max}."), { min: money(prices[0]!), max: money(prices[prices.length - 1]!) }) : ".";
  return `${lead.replace(/\s+in\s*$/, "")}${range} ${tx("Prices are starting prices, and an advisor can confirm which homes are open.")}`;
});
/** 价格从低到高的匹配楼盘：点名推荐、追问选项都围绕最前面的两栋 */
const ranked = computed(() => [...matches.value].sort((x, y) => (buildingPrice(x) || Infinity) - (buildingPrice(y) || Infinity)));
const buildingLink = (item: BuildingRef) => localePath(`/listings/building/${item.slug}`);
const contactLink = (item: BuildingRef) => localePath(regionPath("contact", item.region));
/** 房源下方只接一个问题（不再点名推荐具体楼盘） */
const tail = computed(() => {
  if (step.value || !ranked.value.length) return "";
  if (askedTopics.value.length) return tx("Anything else you'd like to know about these?");
  return ranked.value.length === 1 ? tx("What would you like to know about it?") : tx("What would you like to know about them?");
});

// ——— 房源出来之后的追问：先把基础问题问完，再引导访客问宠物、押金这类关心的事 ———
// 楼盘数据里没有的信息（押金、费用、宠物政策细则）不编，只说明"各楼不同"并引到顾问
const askedTopics = ref<string[]>([]);
const names = (list: string[]) => list.slice(0, 3).join(", ");
const hasPet = (item: BuildingRef) => amenityNames(item).some(n => /\b(pet|dog|cat)s?\b/i.test(n));
/** 追问选项带上具体楼盘名，回答的写法：先说结论（加粗关键事实）→「A couple quick notes」列要点 → 告诉访客去哪里问。楼盘数据里没有的信息不编，坦白说没写明 */
const topicOptions = computed<Option[]>(() => {
  const list = ranked.value;
  if (!list.length) return [];
  const [a, b] = list;
  const nameA = buildingText(a!, "name");
  const nameB = b ? buildingText(b, "name") : "";
  const f = filters.value;
  const topic = (key: string, label: string, ack: () => string, say = label): Option => ({ key, topic: key, label, say, apply: () => {}, ack });
  const getItInWriting = (item: BuildingRef) => `${tx("A couple quick notes:")}\n- ${tx("This is one of those \"get it in writing\" items")}\n- ${fill(tx("The easiest place to ask is our [contact form]({link})"), { link: contactLink(item) })}`;
  const fees = (item: BuildingRef, name: string) => topic(`fees:${item.slug}`, fill(tx("What fees/deposits should I expect at {name}?"), { name }),
    () => `${fill(tx("**{name}** doesn't list its security deposit or application fee online, so I can't quote them here. They depend on the unit and your application."), { name })}\n${getItInWriting(item)}`);
  const out: Option[] = [
    fees(a!, nameA),
    topic(`pet:${a!.slug}`, fill(tx("Is {name} pet friendly?"), { name: nameA }),
      () => (hasPet(a!)
        ? `${fill(tx("**{name}** lists pet-related amenities, but the listing doesn't spell out breed/weight limits or pet fees/deposits, so I'd confirm the exact rules before applying."), { name: nameA })}\n${getItInWriting(a!)}`
        : `${fill(tx("**{name}** doesn't list a pet policy online, so I'd confirm with an advisor before you apply."), { name: nameA })}\n${getItInWriting(a!)}`))
  ];
  if (b)
    out.push(topic(`compare:${a!.slug}:${b.slug}`, fill(tx("Compare {a} and {b}"), { a: nameA, b: nameB }), () => {
      const line = (item: BuildingRef, name: string) => `- **${name}**: ${buildingPrice(item) ? fill(tx("from ${price}/mo"), { price: money(buildingPrice(item)) }) : tx("ask for pricing")}${maxBeds(item) ? `, ${fill(tx("up to {n} bedrooms"), { n: String(maxBeds(item)) })}` : ""}`;
      return `${tx("Here's how they compare:")}\n${line(a!, nameA)}\n${line(b, nameB)}\n${tx("An advisor can help you decide which fits better.")}`;
    }));
  out.push(
    topic(`reach:${a!.slug}`, fill(tx("Let's reach out about {name}"), { name: nameA }),
      () => `${fill(tx("To reach out about **{name}**, the fastest option is our [contact form]({link}), where an advisor will confirm availability and arrange a viewing."), { name: nameA, link: contactLink(a!) })}\n${tx("A couple things worth flagging before you send your note:")}\n- ${buildingPrice(a!) ? fill(tx("The starting price is ${price}/mo, so ask about the specific unit"), { price: money(buildingPrice(a!)) }) : tx("Ask for pricing on the specific unit")}${maxBeds(a!) ? `\n- ${fill(tx("It has up to {n} bedrooms"), { n: String(maxBeds(a!)) })}` : ""}${hasPet(a!) ? `\n- ${tx("Pet-related amenities are listed")}` : ""}`),
    topic(`amenities:${a!.slug}`, fill(tx("What amenities does {name} have?"), { name: nameA }), () => {
      const am = [...new Set(amenityNames(a!).filter(Boolean))];
      return am.length ? `${fill(tx("**{name}** offers: {names}."), { name: nameA, names: am.slice(0, 6).join(", ") })} ${tx("Open its card to see the full list.")}` : fill(tx("Open the card for **{name}** to see its amenities."), { name: nameA });
    }),
    topic("petsearch", fill(tx("Show me {size} in {city} that allow pets"), { size: f.beds ? bedLabel(f.beds).toLowerCase() : tx("homes"), city: f.city ? cityName(f.city) : "" }).replace(/\s+/g, " "), () => petSearchAnswer(list), tx("Show me ones that allow pets.")),
    ...(b ? [fees(b, nameB)] : [])
  );
  return out.filter(o => !askedTopics.value.includes(o.topic!)).slice(0, 3);
});
const skip = (k: StepKey, label: string, say: string): Option => ({ key: `skip-${k}`, label, say, soft: true, ack: () => tx("No problem, we'll keep that open."), apply: () => { skipped.value = [...skipped.value, k]; } });
const options = computed<Option[]>(() => {
  const f = filters.value;
  if (step.value === "city")
    return [
      ...regions.value.map<Option>(r => ({ key: r.slug, label: cityName(r.slug), say: fill(tx("I want to live in {city}."), { city: cityName(r.slug) }).replace(/\.\.$/, "."), apply: () => { f.city = r.slug; } }))
    ];
  if (step.value === "beds")
    return [
      ...BEDS.map<Option>(b =>({ key: b, label: bedLabel(b), say: b === "studio" ? tx("I need a studio.") : b === "1" ? tx("I need a 1-bedroom.") : b === "2" ? tx("I need a 2-bedroom.") : tx("I need 3 or more bedrooms."), apply: () => { f.beds = b; } })),
      skip("beds", tx("Any size"), tx("I'm open to any size."))
    ];
  if (step.value === "budget")
    return [
      ...priceStats.value.tiers.map<Option>(n => ({ key: String(n), label: fill(tx("Under ${amount}"), { amount: money(n) }), say: fill(tx("My budget is under ${amount} a month."), { amount: money(n) }), apply: () => { f.budgetMax = n; } })),
      skip("budget", tx("No limit"), tx("I don't have a budget limit."))
    ];
  const out: Option[] = [...topicOptions.value];
  if (f.city && !matches.value.length) out.push({ key: "relax-city", label: tx("Other cities"), say: tx("Show me other cities."), soft: true, apply: () => unset("city") });
  out.push({ key: "again", label: tx("Start over"), say: tx("Start over."), soft: true, apply: () => reset() });
  return out;
});

// ——— 对话 ———
interface Msg { role: "bot" | "user"; text: string; /** 这条消息属于哪一步的问答，取消回答时据此回退 */ step?: StepKey; /** 占位消息：这个位置显示房源卡片 */ cards?: boolean }
const open = ref(false);
/** 放大模式：桌面上居中显示、约占画面 60%（手机本来就是全屏，不显示这个按钮） */
const expanded = ref(false);
const draft = ref("");
const bodyEl = ref<HTMLElement>();
const inputEl = ref<HTMLInputElement>();
const fabEl = ref<HTMLButtonElement>();
const messages = ref<Msg[]>([]);
const intro = computed(() => tx("Hi, I'm USWOO's AI assistant. I can help you find an apartment."));
/** 第一个气泡：开场白和第一个问题合在一起；访客作答后固定下来，不再随条件变化 */
const opening = ref<string | null>(null);
const thread = computed<Msg[]>(() => [{ role: "bot", text: opening.value ?? (step.value ? `${intro.value} ${prompt.value}` : intro.value) }, ...messages.value]);
/** 当前这一步的问题单独成气泡：第一个问题已经在开场气泡里，不重复 */
const showPrompt = computed(() => (opening.value !== null || !step.value) && !!prompt.value);
/**
 * 对话里实际显示的内容：房源卡片紧跟在"结果说明"之后、放在后面的追问回答之上。
 * 追问时底部那块会被存进记录，同时留一个卡片占位（cards）；没有占位就是还没追问过，卡片接在结果说明后面。
 */
const view = computed<Msg[]>(() => {
  const out: Msg[] = [...thread.value];
  const placed = messages.value.some(m => m.cards);
  if (showPrompt.value && !placed) out.push({ role: "bot", text: prompt.value });
  if (!placed && !step.value && cards.value.length) out.push({ role: "bot", text: "", cards: true });
  if (tail.value) out.push({ role: "bot", text: tail.value });
  return out;
});

function pick(o: Option) {
  const asked = prompt.value;
  // 先记下刚回答的问题和答案，再让回答生效，界面自然进入下一步
  if (step.value) {
    if (opening.value === null) opening.value = `${intro.value} ${asked}`;
    else messages.value.push({ role: "bot", text: asked, step: step.value });
  } else if (o.topic) {
    if (asked) messages.value.push({ role: "bot", text: asked });
    if (cards.value.length) messages.value.push({ role: "bot", text: "", cards: true });
    if (tail.value) messages.value.push({ role: "bot", text: tail.value });
  }
  const answeredStep = step.value ?? undefined;
  messages.value.push({ role: "user", text: o.say ?? o.label, step: answeredStep });
  o.apply();
  // 回答生效后，助手先接一句话，再问下一个问题；最后一个问题（预算）答完直接给结果，不重复说
  if (o.topic) askedTopics.value.push(o.topic);
  if (o.ack && (step.value || o.topic)) messages.value.push({ role: "bot", text: o.ack(), step: answeredStep });
  if (o.to) return navigateTo(o.to);
  scrollDown();
  // 三项都答完、房源列出来之后，网站页面同步跳到所选城市的房源页（浮窗在 app.vue 里，跳转后对话保留）
  nextTick(() => {
    if (!answeredStep || step.value || !filters.value.city) return;
    const target = localePath(regionPath("listings", filters.value.city));
    if (route.path !== target) navigateTo(target);
  });
}

/**
 * 自由输入的基础解析：只认城市、户型、月租预算（以及"宠物"这个意图），用关键词和数字规则，不接模型。
 * 认出来的直接当作回答套用，没认出来就回固定的话（CMS 里的 aiChat.reply）。"靠近某学校"这类位置现在不能按位置筛，会说明并引到顾问。
 */
const CITY_ALIASES: { re: RegExp; name: RegExp }[] = [
  { re: /\b(nyc|new york|ny|nj|new jersey|manhattan|brooklyn|queens|bronx|jersey city|hoboken|nyu|columbia)\b|纽约|新泽西|曼哈顿|布鲁克林|泽西市/i, name: /new york/i },
  { re: /\b(los angeles|la|ucla|usc)\b|洛杉矶/i, name: /los angeles/i },
  { re: /\b(chicago)\b|芝加哥/i, name: /chicago/i },
  { re: /\b(washington|dc|d\.c\.)\b|华盛顿/i, name: /washington/i },
  { re: /\b(philadelphia|philly)\b|费城/i, name: /philadelphia/i },
  { re: /\b(boston|mit|harvard)\b|波士顿/i, name: /boston/i }
];
function parseFree(text: string) {
  const t = text.toLowerCase();
  const out: { city?: string; beds?: BedKey; budget?: number; pet?: boolean; place?: boolean } = {};
  const region = CITY_ALIASES.find(a => a.re.test(text));
  const hit = region ? regions.value.find(r => region.name.test(bi(r.name) || r.slug)) : undefined;
  if (hit) out.city = hit.slug;
  else {
    const direct = regions.value.find(r => (bi(r.name) || "").toLowerCase().split(/[&,]/).some(part => part.trim().length > 3 && t.includes(part.trim())));
    if (direct) out.city = direct.slug;
  }
  if (/\bstudios?\b|开间|单间|工作室/.test(t)) out.beds = "studio";
  else if (/\b(1|one)[ -]?(bed|br|bedroom)|\b1b\b|一居|1居|一室|一房/.test(t)) out.beds = "1";
  else if (/\b(2|two)[ -]?(beds?|br|bedrooms?)|\b2b\b|两居|二居|2居|两室|两房|二室/.test(t)) out.beds = "2";
  else if (/\b(3|three|4|four)\+?[ -]?(beds?|br|bedrooms?)|\b3\+|三居|3居|三室|四居|三房/.test(t)) out.beds = "3+";
  const num = (v: string, k?: string) => Math.round(parseFloat(v.replace(/,/g, "")) * (k ? 1000 : 1));
  const m = t.match(/(?:under|below|less than|max(?:imum)?|up to|budget(?: of| is)?|within|<)\s*\$?\s*(\d[\d,]*(?:\.\d+)?)\s*(k)?/) || t.match(/\$\s*(\d[\d,]*(?:\.\d+)?)\s*(k)?/) || t.match(/(\d[\d,]*(?:\.\d+)?)\s*(k)\b/) || t.match(/预算\s*(?:是|为)?\s*(\d[\d,]*)()/) || t.match(/(\d[\d,]{2,5})\s*()(?:\/mo|a month|per month|以内|以下|每月|美元|刀|块)/);
  if (m) {
    const n = num(m[1]!, m[2]);
    if (n >= 500 && n <= 30000) out.budget = n;
  }
  if (/\bpets?\b|\bdogs?\b|\bcats?\b|宠物|养狗|养猫/.test(t)) out.pet = true;
  if (/\bnear\b|\bclose to\b|\bnext to\b|\bby the\b|附近|靠近|离.*近/.test(t)) out.place = true;
  return out;
}
const petSearchAnswer = (list: BuildingRef[]) => {
  const hits = list.filter(hasPet).map(item => `**${buildingText(item, "name")}**`);
  return hits.length ? `${fill(tx("These list pet-related amenities: {names}."), { names: names(hits) })} ${tx("An advisor can confirm each building's pet rules.")}` : tx("None of these list pet-related amenities yet, so an advisor can check which buildings allow pets.");
};

function send(text: string) {
  const value = text.trim();
  if (!value) return;
  const parsed = parseFree(value);
  const f = filters.value;
  const understood = !!(parsed.city || parsed.beds || parsed.budget || parsed.pet);
  const before = step.value;
  const asked = prompt.value;
  const hadOpening = opening.value !== null;
  if (!hadOpening && before) opening.value = `${intro.value} ${asked}`;
  // 房源已经列出来时，底部那一块（结果说明、卡片、点名推荐）是"当前状态"，要先存进对话记录，
  // 否则新的提问和回复会排到它们上面
  if (!before && matches.value.length && !askedTopics.value.length) {
    if (prompt.value) messages.value.push({ role: "bot", text: prompt.value });
    if (cards.value.length) messages.value.push({ role: "bot", text: "", cards: true });
    if (tail.value) messages.value.push({ role: "bot", text: tail.value });
    askedTopics.value.push("free-text");
  }
  let reply = c("aiChat.reply");
  if (understood) {
    if (parsed.city) f.city = parsed.city;
    if (parsed.beds) f.beds = parsed.beds;
    if (parsed.budget) f.budgetMax = parsed.budget;
    skipped.value = skipped.value.filter(k => !((k === "city" && parsed.city) || (k === "beds" && parsed.beds) || (k === "budget" && parsed.budget)));
    // 条件变了，结果要重新说明：清掉"已问过的追问"，下方的结果说明和点名推荐会按新条件重新出现
    if (parsed.city || parsed.beds || parsed.budget) {
      askedTopics.value = [];
      messages.value = messages.value.filter(m => !m.cards);
    }
    // 当前这一步被这句话回答了：把刚才的问题存进记录，再接用户的话
    if (before && hadOpening && step.value !== before) messages.value.push({ role: "bot", text: asked, step: before });
    const bits = [parsed.city ? cityName(parsed.city) : "", parsed.beds ? bedLabel(parsed.beds).toLowerCase() : "", parsed.budget ? fill(tx("under ${amount} a month"), { amount: money(parsed.budget) }) : ""].filter(Boolean);
    const lines: string[] = [];
    if (bits.length) lines.push(`${tx("Got it —")} ${bits.join(", ")}.`);
    if (parsed.pet) lines.push(step.value ? tx("I'll keep pets in mind; once we have your city, size and budget I can check which buildings list pet-related amenities.") : petSearchAnswer(matches.value));
    if (parsed.place) lines.push(tx("I can't search by exact location yet, so I'll show buildings across the city; an advisor can help with the commute."));
    reply = lines.join("\n");
  } else if (parsed.place) {
    reply = `${c("aiChat.reply")}\n${tx("I can't search by exact location yet; an advisor can help with the commute.")}`;
  }
  messages.value.push({ role: "user", text: value.slice(0, 500) }, { role: "bot", text: reply });
  draft.value = "";
  scrollDown();
  // 三项都答完、房源出来后，页面同步跳到所选城市的房源页（和点选项时一样）
  if (understood) {
    nextTick(() => {
      if (step.value || !filters.value.city) return;
      const target = localePath(regionPath("listings", filters.value.city));
      if (route.path !== target) navigateTo(target);
    });
  }
}

function reset() {
  messages.value = [];
  opening.value = null;
  draft.value = "";
  skipped.value = [];
  askedTopics.value = [];
  filters.value = emptyFilters();
  viewingOn.value = true;
}

function scrollDown() {
  nextTick(() => bodyEl.value?.scrollTo({ top: bodyEl.value.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
}
function openPanel() {
  open.value = true;
  nextTick(() => inputEl.value?.focus({ preventScroll: true }));
}
function closePanel() {
  open.value = false;
  nextTick(() => fabEl.value?.focus({ preventScroll: true }));
}
</script>
