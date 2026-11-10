/**
 * 标题、段落里允许的少量内联标记。先整体转义，再只把白名单里的标记还原，
 * 所以内容里即使混入其他 HTML 也只会被当成文字显示。
 */
const ALLOWED = [
  /&lt;br\s*\/?&gt;/g,
  /&lt;br class=(?:&quot;)?m-br(?:&quot;)?\s*\/?&gt;/g,
  /&lt;span class=(?:&quot;)?(?:zh-d|zh-m|em|accent|pink|nowrap)(?:&quot;)?&gt;/g,
  /&lt;\/span&gt;/g,
  /&lt;(?:em|strong|b|i)&gt;/g,
  /&lt;\/(?:em|strong|b|i)&gt;/g
];

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function richHtml(text: string): string {
  let html = escapeHtml(text);
  for (const pattern of ALLOWED) {
    html = html.replace(pattern, match => match.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"'));
  }
  return html;
}
