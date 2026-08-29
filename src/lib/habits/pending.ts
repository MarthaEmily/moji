// 「今日未完成」计算：用于习惯页顶部提醒条与标签栏红点。
import { isCheckedToday, localDateStr } from "./streak";

export interface PendingHabit {
  logDates: string[];
}

/** 今天还没打卡的习惯数量 */
export function countPendingToday(
  habits: PendingHabit[],
  today = localDateStr(),
): number {
  return habits.reduce(
    (n, h) => (isCheckedToday(h.logDates, today) ? n : n + 1),
    0,
  );
}
