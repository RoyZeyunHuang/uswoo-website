/**
 * 区块序号（01、02……）：按页面上实际展示的区块自动编号，不在 CMS 里填写。
 * 某个地区隐藏了区块时，后面的序号自动前移，不会出现跳号。
 *
 * @param keys  带序号的区块键，按页面上的先后顺序
 * @param shown 区块当前是否展示（与模板里 v-if 的条件一致）
 */
export function useBlockNumbers<K extends string>(keys: readonly K[], shown: (key: K) => boolean) {
  const visible = computed(() => keys.filter(shown));
  return (key: K): string => {
    const position = visible.value.indexOf(key);
    return position < 0 ? "" : String(position + 1).padStart(2, "0");
  };
}
