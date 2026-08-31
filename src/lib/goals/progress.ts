// 阶段进度与偏差判定的纯函数（客户端与服务端共用）。
// 双信号：过程（阶段打卡率）+ 结果（手动记的当前数值 vs 里程碑）。

import { daysBetween, localDate, type GoalDirection } from "./types";

export type Pace = "behind" | "on-track" | "ahead";

export interface StageProgress {
  /** 阶段是否为当前进行中（今天落在起止区间内）。 */
  active: boolean;
  /** 阶段是否已过期（今天 > endDate）。 */
  ended: boolean;
  /** 时间进度 0-1（阶段已过天数 / 阶段总天数）。 */
  timeFrac: number;
  /** 打卡进度 0-1（已打卡天数 / 应打卡天数，应打卡=已过天数）。 */
  checkFrac: number;
  /** 结果进度 0-1（当前数值相对里程碑的达成度；无数值则为 null）。 */
  valueFrac: number | null;
  pace: Pace;
}

const AHEAD = 1.15; // 领先阈值：完成度 ≥ 时间进度 * 1.15
const BEHIND = 0.7; // 落后阈值：完成度 ≤ 时间进度 * 0.7

export function computeStageProgress(params: {
  startDate: string;
  endDate: string;
  /** 本阶段全部子任务在已过天数内的累计打卡次数之和。 */
  checkedUnits: number;
  /** 本阶段子任务数量（≥1）。 */
  taskCount: number;
  today?: string;
  // 结果信号（可选）
  startValue?: number | null;
  currentValue?: number | null;
  milestoneValue?: number | null;
  direction?: GoalDirection;
}): StageProgress {
  const today = params.today ?? localDate();
  const totalDays = Math.max(1, daysBetween(params.startDate, params.endDate));
  const elapsed = Math.min(
    totalDays,
    Math.max(0, daysBetween(params.startDate, today)),
  );
  const active = today >= params.startDate && today <= params.endDate;
  const ended = today > params.endDate;

  const timeFrac = Math.min(1, elapsed / totalDays);
  // 应打卡次数 = 子任务数 × 已过天数。
  const expectedChecks = Math.max(1, elapsed * Math.max(1, params.taskCount));
  const checkFrac = Math.min(1, params.checkedUnits / expectedChecks);

  let valueFrac: number | null = null;
  if (
    params.startValue != null &&
    params.currentValue != null &&
    params.milestoneValue != null &&
    params.milestoneValue !== params.startValue
  ) {
    const span = params.milestoneValue - params.startValue;
    const done = params.currentValue - params.startValue;
    valueFrac = Math.max(0, Math.min(1.5, done / span));
  }

  // 综合完成度：有结果信号时结果占 60%、过程占 40%；否则纯过程。
  const combined =
    valueFrac != null ? valueFrac * 0.6 + checkFrac * 0.4 : checkFrac;

  let pace: Pace = "on-track";
  const ref = Math.max(0.05, timeFrac);
  if (combined >= ref * AHEAD) pace = "ahead";
  else if (combined <= ref * BEHIND) pace = "behind";

  return { active, ended, timeFrac, checkFrac, valueFrac, pace };
}

/** 是否应触发自动重拆：阶段已结束，或进行中且明显偏快/偏慢。 */
export function shouldReplan(p: StageProgress): boolean {
  if (p.ended) return true;
  if (p.active && p.timeFrac >= 0.3 && p.pace !== "on-track") return true;
  return false;
}

/** 统计一个阶段内、落在 [startDate, today] 窗口内的子任务累计打卡次数之和。 */
export function sumCheckedUnits(
  tasks: { checkedDays: string[] }[],
  startDate: string,
  today = localDate(),
): number {
  let sum = 0;
  for (const tk of tasks) {
    for (const d of tk.checkedDays) {
      if (d >= startDate && d <= today) sum += 1;
    }
  }
  return sum;
}
