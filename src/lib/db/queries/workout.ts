import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { workoutDays, type WorkoutDay } from "../schema/workout";

/** 读取某日健身状态；不存在则以 baseMinutes 创建后返回（幂等）。 */
export async function getOrCreateWorkoutDay(data: {
  userId: string;
  day: string;
  baseMinutes: number;
}): Promise<WorkoutDay> {
  const existing = await db
    .select()
    .from(workoutDays)
    .where(and(eq(workoutDays.userId, data.userId), eq(workoutDays.day, data.day)))
    .limit(1);
  if (existing[0]) return existing[0];

  const rows = await db
    .insert(workoutDays)
    .values({
      userId: data.userId,
      day: data.day,
      baseMinutes: data.baseMinutes,
      shiftedMinutes: data.baseMinutes,
    })
    // 并发下若已存在则忽略，随后回查。
    .onConflictDoNothing({ target: [workoutDays.userId, workoutDays.day] })
    .returning();
  if (rows[0]) return rows[0];

  const again = await db
    .select()
    .from(workoutDays)
    .where(and(eq(workoutDays.userId, data.userId), eq(workoutDays.day, data.day)))
    .limit(1);
  return again[0];
}

/** 持久化后移后的目标时间（只允许向后，且不超过 1440）。 */
export async function shiftWorkoutDay(data: {
  userId: string;
  day: string;
  shiftedMinutes: number;
}): Promise<WorkoutDay | undefined> {
  const clamped = Math.max(0, Math.min(1440, Math.round(data.shiftedMinutes)));
  const rows = await db
    .update(workoutDays)
    .set({ shiftedMinutes: clamped, updatedAt: new Date() })
    .where(and(eq(workoutDays.userId, data.userId), eq(workoutDays.day, data.day)))
    .returning();
  return rows[0];
}

/** 标记完成 / 取消完成。 */
export async function setWorkoutCompleted(data: {
  userId: string;
  day: string;
  completed: boolean;
}): Promise<WorkoutDay | undefined> {
  const rows = await db
    .update(workoutDays)
    .set({
      completed: data.completed,
      completedAt: data.completed ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(workoutDays.userId, data.userId), eq(workoutDays.day, data.day)))
    .returning();
  return rows[0];
}
