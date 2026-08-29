// 渐进加量引擎（纯确定性、可解释）。
// 输入当前目标量与连续天数，判断是否建议加量、以及建议的新目标量。

import { computeStreak } from "./streak";

/** 触发加量建议的最小连续天数 */
export const BUMP_STREAK_THRESHOLD = 5;

/** 目标量上限（避免无限增长） */
export const MAX_TARGET = 999;

/**
 * 计算下一档目标量：按当前量分档，小步增长。
 * - <10：+2
 * - 10-29：约 +25%（至少 +3）
 * - 30-99：约 +20%（取整到 5）
 * - >=100：约 +10%（取整到 10）
 */
export function nextTarget(current: number): number {
  let next: number;
  if (current < 10) {
    next = current + 2;
  } else if (current < 30) {
    next = current + Math.max(3, Math.round(current * 0.25));
  } else if (current < 100) {
    next = Math.round((current * 1.2) / 5) * 5;
  } else {
    next = Math.round((current * 1.1) / 10) * 10;
  }
  return Math.min(MAX_TARGET, Math.max(current + 1, next));
}

export interface BumpSuggestion {
  suggest: boolean;
  streak: number;
  from: number;
  to: number;
}

/**
 * 是否建议加量：
 * - 当前连续天数 >= 阈值
 * - 且本次 streak 高于「上次加量时的基准」至少一个阈值周期（防止刚加完又提示）
 */
export function evaluateBump(input: {
  logDates: string[];
  targetAmount: number;
  lastBumpStreak: number;
  today?: string;
}): BumpSuggestion {
  const streak = computeStreak(input.logDates, input.today);
  const to = nextTarget(input.targetAmount);
  const suggest =
    streak >= BUMP_STREAK_THRESHOLD &&
    streak >= input.lastBumpStreak + BUMP_STREAK_THRESHOLD &&
    to > input.targetAmount &&
    input.targetAmount < MAX_TARGET;
  return { suggest, streak, from: input.targetAmount, to };
}

/** 「有点难」时的下调：退回起步量与当前量之间的一小步（不低于起步量） */
export function easeTarget(current: number, base: number): number {
  const eased = current <= base ? base : Math.max(base, Math.round(current * 0.85));
  return eased;
}
