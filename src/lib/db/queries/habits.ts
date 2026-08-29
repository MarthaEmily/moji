import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "../client";
import { habits, habitLogs, type Habit, type HabitLog } from "../schema/habits";

export interface HabitWithLogs extends Habit {
  /** 最近若干天的打卡日期（YYYY-MM-DD 字符串），倒序 */
  logDates: string[];
}

/** 列出用户的全部习惯，并附带最近 90 天的打卡日期，供前端算 streak 与今日状态 */
export async function listHabitsWithLogs(
  userId: string,
): Promise<HabitWithLogs[]> {
  const rows = await db
    .select()
    .from(habits)
    .where(eq(habits.userId, userId))
    .orderBy(desc(habits.createdAt));

  if (rows.length === 0) return [];

  const since = new Date();
  since.setDate(since.getDate() - 90);
  const sinceStr = since.toISOString().slice(0, 10);

  const logs = await db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.userId, userId), gte(habitLogs.logDate, sinceStr)));

  const byHabit = new Map<string, string[]>();
  for (const log of logs) {
    const list = byHabit.get(log.habitId) ?? [];
    list.push(log.logDate);
    byHabit.set(log.habitId, list);
  }

  return rows.map((h) => ({
    ...h,
    logDates: (byHabit.get(h.id) ?? []).sort((a, b) => b.localeCompare(a)),
  }));
}

export async function createHabit(data: {
  userId: string;
  name: string;
  targetAmount: number;
  unit: string;
  icon: string;
}): Promise<Habit> {
  const rows = await db
    .insert(habits)
    .values({ ...data, baseAmount: data.targetAmount })
    .returning();
  return rows[0];
}

/** 批量创建多个习惯（AI 拆解一键添加），每个 baseAmount = 起步 targetAmount */
export async function createHabitsBatch(
  userId: string,
  items: { name: string; targetAmount: number; unit: string; icon: string }[],
): Promise<Habit[]> {
  if (items.length === 0) return [];
  const values = items.map((it) => ({
    userId,
    name: it.name,
    targetAmount: it.targetAmount,
    baseAmount: it.targetAmount,
    unit: it.unit,
    icon: it.icon,
  }));
  return db.insert(habits).values(values).returning();
}

/** 调整目标量（加量/下调），并记录本次的连续天数基准以防重复建议 */
export async function updateHabitTarget(data: {
  id: string;
  userId: string;
  targetAmount: number;
  lastBumpStreak: number;
}): Promise<Habit | undefined> {
  const rows = await db
    .update(habits)
    .set({
      targetAmount: data.targetAmount,
      lastBumpStreak: data.lastBumpStreak,
    })
    .where(and(eq(habits.id, data.id), eq(habits.userId, data.userId)))
    .returning();
  return rows[0];
}

export async function deleteHabitForUser(
  id: string,
  userId: string,
): Promise<boolean> {
  const rows = await db
    .delete(habits)
    .where(and(eq(habits.id, id), eq(habits.userId, userId)))
    .returning({ id: habits.id });
  return rows.length > 0;
}

/** 校验习惯归属，防止越权打卡他人习惯 */
export async function habitBelongsToUser(
  habitId: string,
  userId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

/** 打卡：幂等（同日重复打卡不报错） */
export async function checkInHabit(data: {
  habitId: string;
  userId: string;
  logDate: string;
}): Promise<HabitLog | null> {
  const rows = await db
    .insert(habitLogs)
    .values(data)
    .onConflictDoNothing({
      target: [habitLogs.habitId, habitLogs.logDate],
    })
    .returning();
  return rows[0] ?? null;
}

/** 取消当日打卡 */
export async function undoCheckIn(data: {
  habitId: string;
  userId: string;
  logDate: string;
}): Promise<boolean> {
  const rows = await db
    .delete(habitLogs)
    .where(
      and(
        eq(habitLogs.habitId, data.habitId),
        eq(habitLogs.userId, data.userId),
        eq(habitLogs.logDate, data.logDate),
      ),
    )
    .returning({ id: habitLogs.id });
  return rows.length > 0;
}
