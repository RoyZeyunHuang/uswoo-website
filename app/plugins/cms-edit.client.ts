/**
 * CMS 页面编辑器的实时预览通道。只有同时满足这几条才启用，普通访客不受任何影响：
 * 本页被内嵌在别的页面里、网址带 ?cms-edit、上层页面的来源在允许名单里（NUXT_PUBLIC_CMS_ORIGINS）。
 *
 * 与编辑器之间的消息（都带 source 字段，只认来自上层窗口且来源相符的消息）：
 *   编辑器 → 官网  { source: "uswoo-cms", type: "content", key, payload }   用这份内容渲染该页面键
 *                  { source: "uswoo-cms", type: "focus", ref }             滚动到「页面键:字段路径」对应的位置并高亮
 *   官网 → 编辑器  { source: "uswoo-site", type: "ready", path }           可以开始送内容了
 *                  { source: "uswoo-site", type: "select", ref }           点了页面上的某个字段
 */
export default defineNuxtPlugin(() => {
  if (window.parent === window || !new URLSearchParams(location.search).has("cms-edit")) return;
  const allowed = String(useRuntimeConfig().public.cmsOrigins || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
  let parentOrigin = location.ancestorOrigins?.[0] ?? "";
  if (!parentOrigin && document.referrer) {
    try {
      parentOrigin = new URL(document.referrer).origin;
    } catch {
      parentOrigin = "";
    }
  }
  if (!parentOrigin || !allowed.includes(parentOrigin)) return;

  const { active, overrides, epoch } = useCmsEdit();
  const send = (message: Record<string, unknown>) => window.parent.postMessage({ source: "uswoo-site", ...message }, parentOrigin);

  // ---- 页面上的元素 ↔ 字段 ----

  const MARKED = 'img[src*="#cms="], video[poster*="#cms="], [style*="#cms="]';
  /** 元素自己直接带的字段：自己的文字节点，或自己的图片地址 */
  function ownRef(element: Element): string | null {
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const ref = cmsRefOfText(node.nodeValue);
        if (ref) return ref;
      }
    }
    if (element.matches(MARKED)) return cmsRefOfUrl(element.getAttribute("src") || element.getAttribute("poster") || element.getAttribute("style"));
    return null;
  }
  /** 范围内所有带字段标记的元素 */
  function allMarked(root: Element = document.body): { element: Element; ref: string }[] {
    const found: { element: Element; ref: string }[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const ref = cmsRefOfText(node.nodeValue);
      if (ref && node.parentElement) found.push({ element: node.parentElement, ref });
    }
    for (const element of root.querySelectorAll(MARKED)) {
      const ref = ownRef(element);
      if (ref) found.push({ element, ref });
    }
    return found;
  }
  /** 鼠标所在位置对应哪个字段：先看自己和上几层；图片常被遮罩盖住，所以也看小容器里的第一个字段 */
  function resolve(target: EventTarget | null): { element: Element; ref: string } | null {
    let element = target instanceof Element ? target : null;
    for (let depth = 0; element && element !== document.body && depth < 6; depth += 1, element = element.parentElement) {
      const ref = ownRef(element);
      if (ref) return { element, ref };
      if (depth < 3 && !element.matches("section, main, header, footer, nav, form")) {
        const inside = allMarked(element)[0];
        if (inside) return inside;
      }
    }
    return null;
  }

  // ---- 高亮框 ----

  const box = document.createElement("div");
  box.style.cssText =
    "position:fixed;z-index:2147483646;pointer-events:none;border:2px solid #ff4f8b;border-radius:4px;box-shadow:0 0 0 4px rgba(255,79,139,.18);display:none;transition:all .12s ease";
  let boxed: Element | null = null;
  function place() {
    if (!boxed || !boxed.isConnected) {
      box.style.display = "none";
      return;
    }
    const rect = boxed.getBoundingClientRect();
    box.style.display = "block";
    box.style.left = `${rect.left - 4}px`;
    box.style.top = `${rect.top - 4}px`;
    box.style.width = `${rect.width + 8}px`;
    box.style.height = `${rect.height + 8}px`;
  }
  function highlight(element: Element | null) {
    boxed = element;
    place();
  }

  function focus(ref: string) {
    const marked = allMarked();
    const hit = marked.find(item => item.ref === ref) ?? marked.find(item => item.ref.startsWith(`${ref}.`));
    if (!hit) return;
    hit.element.scrollIntoView({ block: "center", behavior: "smooth" });
    highlight(hit.element);
  }

  // ---- 启用 ----

  onNuxtReady(() => {
    // 等页面接管完成后再进入编辑状态：服务端输出里没有标记，提前切换会让两边内容对不上
    active.value = true;
    document.documentElement.classList.add("cms-editing");
    document.body.appendChild(box);

    const hidden = new Map<string, string>();
    window.addEventListener("message", event => {
      if (event.origin !== parentOrigin || event.source !== window.parent) return;
      const data = event.data as { source?: string; type?: string; key?: string; payload?: unknown; ref?: string } | null;
      if (!data || data.source !== "uswoo-cms") return;
      if (data.type === "content" && typeof data.key === "string" && data.payload && typeof data.payload === "object") {
        const payload = data.payload as Record<string, unknown>;
        overrides.value = { ...overrides.value, [data.key]: payload };
        // 哪些区块被隐藏了；变了（含第一次收到）就整页重新挂载，新出现的区块才能绑定上滚动出现的效果
        const signature = Object.keys(payload)
          .filter(key => (payload[key] as { show?: unknown } | null)?.show === false)
          .join(",");
        if (hidden.get(data.key) !== signature) epoch.value += 1;
        hidden.set(data.key, signature);
      } else if (data.type === "focus" && typeof data.ref === "string") {
        focus(data.ref);
      }
    });

    document.addEventListener("mousemove", event => highlight(resolve(event.target)?.element ?? null), { passive: true });
    document.addEventListener("mouseleave", () => highlight(null));
    window.addEventListener("scroll", place, { passive: true, capture: true });
    window.addEventListener("resize", place, { passive: true });
    // 预览里不跳转、不提交表单：点到带字段的位置就通知编辑器，其余链接只是不生效
    document.addEventListener(
      "click",
      event => {
        const hit = resolve(event.target);
        if (hit) {
          event.preventDefault();
          event.stopPropagation();
          highlight(hit.element);
          send({ type: "select", ref: hit.ref });
        } else if (event.target instanceof Element && event.target.closest("a[href]")) {
          event.preventDefault();
        }
      },
      true
    );
    document.addEventListener(
      "submit",
      event => {
        event.preventDefault();
        event.stopPropagation();
      },
      true
    );

    send({ type: "ready", path: location.pathname });
  });
});
