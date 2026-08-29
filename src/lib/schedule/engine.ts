// 生物钟作息推理引擎 —— 纯确定性规则，可复算，不依赖任何外部服务。
// 时间点全部由规则计算；AI 只负责为每个节点生成科学依据文案。

export type WorkoutWindow = "morning" | "noon" | "evening";

export type NodeKey =
  | "wake"
  | "breakfast"
  | "lunch"
  | "workout"
  | "dinner"
  | "bedtime";

export interface ScheduleInput {
  /** 起床时间，分钟数（自 00:00 起，0-1439） */
  wakeMinutes: number;
  /** 目标睡眠时长（小时） */
  sleepHours: number;
  /** 健身偏好时段 */
  workoutWindow: WorkoutWindow;
}

export interface ScheduleNode {
  key: NodeKey;
  /** 节点分钟数（可 >=1440 表示跨到次日，展示时取模） */
  minutes: number;
  title: string;
}

export interface ScheduleResult {
  nodes: ScheduleNode[];
  /** 偏好时段与硬约束冲突时的说明；无冲突为 null */
  conflict: string | null;
  input: ScheduleInput;
}

export const NODE_TITLES: Record<NodeKey, string> = {
  wake: "起床",
  breakfast: "早餐",
  lunch: "午餐",
  workout: "健身",
  dinner: "晚餐",
  bedtime: "上床",
};

const HOUR = 60;

/** 把分钟数格式化为 HH:MM（自动对 1440 取模，处理跨日） */
export function formatTime(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** 偏好时段的目标健身「开始」时间（分钟，自起床日 00:00 起） */
function preferredWorkoutStart(window: WorkoutWindow): number {
  switch (window) {
    case "morning":
      return 8 * HOUR; // 08:00
    case "noon":
      return 13 * HOUR; // 13:00
    case "evening":
      return 18 * HOUR; // 18:00
  }
}

const WORKOUT_DURATION = 60; // 健身时长 1h
const MEAL_DURATION = 30; // 一餐用时 30min

/**
 * 反向推理一日作息。
 * 硬约束：
 * - bedtime = wake + 24h - sleepHours
 * - 晚餐结束 ≤ bedtime - 3h
 * - 健身结束 ≤ bedtime - 4.5h
 * - 午餐结束 ≤ 健身开始 - 3h
 * - 早餐 = 起床后 45min
 * 健身在偏好窗口内取值，若与约束冲突则就近前移并记录冲突原因。
 */
export function computeSchedule(input: ScheduleInput): ScheduleResult {
  const { wakeMinutes, sleepHours, workoutWindow } = input;

  const bedtime = wakeMinutes + 24 * HOUR - sleepHours * HOUR;
  const breakfast = wakeMinutes + 45;

  // 健身结束的最晚允许时刻
  const workoutEndLimit = bedtime - 4.5 * HOUR;
  const workoutStartLimit = workoutEndLimit - WORKOUT_DURATION;

  let workoutStart = preferredWorkoutStart(workoutWindow);
  let conflict: string | null = null;

  // 健身不能早于早餐后 1 小时
  const earliestWorkout = breakfast + MEAL_DURATION + HOUR;
  if (workoutStart < earliestWorkout) {
    workoutStart = earliestWorkout;
    conflict = `所选时段偏早，已把健身顺延到 ${formatTime(
      workoutStart,
    )}，确保餐后有足够消化时间。`;
  }

  // 健身不能晚于约束上限（睡前 4.5h 前完成）
  if (workoutStart > workoutStartLimit) {
    workoutStart = workoutStartLimit;
    conflict = `所选时段与睡眠安排冲突，已把健身提前到 ${formatTime(
      workoutStart,
    )}，确保睡前约 4.5 小时前完成训练。`;
  }

  const workout = workoutStart;

  // 午餐结束 ≤ 健身开始 - 3h → 午餐开始 = 健身开始 - 3h - 用餐时长
  let lunch = workout - 3 * HOUR - MEAL_DURATION;
  // 午餐不能早于早餐后 3h
  const earliestLunch = breakfast + 3 * HOUR;
  if (lunch < earliestLunch) lunch = earliestLunch;

  // 晚餐结束 ≤ bedtime - 3h → 晚餐开始 = bedtime - 3h - 用餐时长
  const dinner = bedtime - 3 * HOUR - MEAL_DURATION;

  const nodes: ScheduleNode[] = [
    { key: "wake", minutes: wakeMinutes, title: NODE_TITLES.wake },
    { key: "breakfast", minutes: breakfast, title: NODE_TITLES.breakfast },
    { key: "lunch", minutes: lunch, title: NODE_TITLES.lunch },
    { key: "workout", minutes: workout, title: NODE_TITLES.workout },
    { key: "dinner", minutes: dinner, title: NODE_TITLES.dinner },
    { key: "bedtime", minutes: bedtime, title: NODE_TITLES.bedtime },
  ];

  return { nodes, conflict, input };
}

export const WORKOUT_LABELS: Record<WorkoutWindow, string> = {
  morning: "早",
  noon: "午",
  evening: "晚",
};
