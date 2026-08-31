// 健身「到点未完成自动后移」的纯计算逻辑，客户端与服务端共用。
// 规则（与创作者确认）：
//  - 到了目标时间还没完成，就每次顺延固定 +20 分钟；
//  - 最晚不超过当天 24:00（用 1440 表示，即封顶不再后移）；
//  - 全程不报红、不催促。

export const WORKOUT_SHIFT_STEP = 20; // 每次顺延分钟数
export const WORKOUT_CAP = 1440; // 24:00 封顶（分钟）

/**
 * 给定当前的目标分钟数与「现在」的分钟数，计算后移后的新目标。
 * 若目标已封顶（>=1440）或尚未到点，则保持不变。
 * 否则以 20 分钟为步进，一直顺延到 > now 或触及 1440 为止。
 */
export function nextWorkoutMinutes(current: number, nowMinutes: number): number {
  if (current >= WORKOUT_CAP) return WORKOUT_CAP;
  if (nowMinutes < current) return current;
  // 已经到点/过点：顺延到刚好超过 now 的下一个 20min 台阶。
  let next = current;
  while (next <= nowMinutes && next < WORKOUT_CAP) {
    next += WORKOUT_SHIFT_STEP;
  }
  return Math.min(next, WORKOUT_CAP);
}

/** 是否已封顶（停在 24:00，不再后移）。 */
export function isWorkoutCapped(minutes: number): boolean {
  return minutes >= WORKOUT_CAP;
}
