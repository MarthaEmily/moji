import { and, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { plans, type PlanRow } from "../schema/plans";

export async function listPlansByUser(userId: string): Promise<PlanRow[]> {
  return db
    .select()
    .from(plans)
    .where(eq(plans.userId, userId))
    .orderBy(desc(plans.createdAt));
}

export async function createPlan(data: {
  userId: string;
  wakeMinutes: number;
  sleepHours: number;
  workoutWindow: string;
}): Promise<PlanRow> {
  const rows = await db.insert(plans).values(data).returning();
  return rows[0];
}

/** 删除，且强制按 userId 归属（不信任请求方 id） */
export async function deletePlanForUser(
  id: string,
  userId: string,
): Promise<boolean> {
  const rows = await db
    .delete(plans)
    .where(and(eq(plans.id, id), eq(plans.userId, userId)))
    .returning({ id: plans.id });
  return rows.length > 0;
}
