// 阶段目标相关的共享类型与纯日期工具（客户端与服务端共用，无副作用）。

export type GoalKind = "study" | "exam" | "weight" | "fitness" | "skill" | "other";
export type GoalDirection = "up" | "down";

export const GOAL_KINDS: GoalKind[] = [
  "study",
  "exam",
  "weight",
  "fitness",
  "skill",
  "other",
];

/** 阶段内的一个每日子任务（可单独打卡）。 */
export interface StageTaskPlan {
  name: string;
  dailyTarget: number;
  dailyUnit: string;
  icon: string;
}

/** 单个阶段的规划（AI 或降级模板产出，尚未落库）。 */
export interface StagePlan {
  name: string;
  focus: string;
  /** 阶段天数占比权重（>0），由 planner 分配实际起止日期。 */
  weight: number;
  /** 本阶段每天要做的 2-4 个子任务，每个可单独打卡。 */
  tasks: StageTaskPlan[];
  /** 阶段末期望到达的结果数值（可空，纯过程型不填）。 */
  milestoneValue: number | null;
  icon: string;
}

export interface GoalPlanInput {
  title: string;
  kind: GoalKind;
  /** 用户当下水平自述（可空字符串），让起点贴合真实水平。 */
  startLevel: string;
  startValue: number | null;
  targetValue: number | null;
  valueUnit: string | null;
  direction: GoalDirection;
  /** 剩余天数（重拆时为从今天到截止日；首拆时为全程）。 */
  daysRemaining: number;
}

// ---- 纯日期工具 ----

export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return localDate(dt);
}

/** 含首尾的天数差（endDate - startDate + 1）。 */
export function daysBetween(startStr: string, endStr: string): number {
  const [ys, ms, ds] = startStr.split("-").map(Number);
  const [ye, me, de] = endStr.split("-").map(Number);
  const a = new Date(ys, ms - 1, ds).getTime();
  const b = new Date(ye, me - 1, de).getTime();
  return Math.round((b - a) / 86_400_000) + 1;
}

/** 把带 weight 的阶段序列按总天数分配为连续的 [startDate,endDate]。 */
export interface DatedStage extends StagePlan {
  orderIndex: number;
  startDate: string;
  endDate: string;
}

export function assignDates(
  stages: StagePlan[],
  startDate: string,
  deadline: string,
): DatedStage[] {
  const total = Math.max(1, daysBetween(startDate, deadline));
  const sumW = stages.reduce((s, x) => s + Math.max(0.0001, x.weight), 0);
  const out: DatedStage[] = [];
  let cursor = startDate;
  let used = 0;
  stages.forEach((st, i) => {
    const isLast = i === stages.length - 1;
    let len = Math.max(1, Math.round((Math.max(0.0001, st.weight) / sumW) * total));
    if (isLast) len = Math.max(1, total - used); // 末段吃掉余数，精确对齐截止日
    // 防止累计超过总天数
    if (!isLast && used + len > total - (stages.length - 1 - i)) {
      len = Math.max(1, total - (stages.length - 1 - i) - used);
    }
    const endDate = addDays(cursor, len - 1);
    out.push({ ...st, orderIndex: i, startDate: cursor, endDate });
    cursor = addDays(endDate, 1);
    used += len;
  });
  return out;
}
