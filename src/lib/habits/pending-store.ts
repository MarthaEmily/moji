"use client";

// 跨页面共享「今日未完成习惯数」的极简外部 store（useSyncExternalStore）。
// 习惯页在加载/打卡后写入，标签栏读取以显示红点。
import { useSyncExternalStore } from "react";

let pendingCount = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setPendingCount(n: number) {
  const next = Math.max(0, Math.floor(n));
  if (next === pendingCount) return;
  pendingCount = next;
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return pendingCount;
}

/** 读取当前未完成数（客户端）；SSR 返回 0 */
export function usePendingCount(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}
