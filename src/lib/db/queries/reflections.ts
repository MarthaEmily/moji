import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { reflections, type Reflection } from "../schema/reflections";

/** 拉取某用户某天的完整心得对话（按时间升序） */
export async function listReflectionsForDate(
  userId: string,
  entryDate: string,
): Promise<Reflection[]> {
  return db
    .select()
    .from(reflections)
    .where(and(eq(reflections.userId, userId), eq(reflections.entryDate, entryDate)))
    .orderBy(asc(reflections.createdAt));
}

/** 追加一条心得消息（user 或 assistant） */
export async function addReflection(data: {
  userId: string;
  entryDate: string;
  role: "user" | "assistant";
  content: string;
}): Promise<Reflection> {
  const rows = await db.insert(reflections).values(data).returning();
  return rows[0];
}

/** 列出该用户有心得记录的日期（去重，最近在前），用于历史回看 */
export async function listReflectionDates(
  userId: string,
  limit = 60,
): Promise<string[]> {
  const rows = await db
    .selectDistinct({ entryDate: reflections.entryDate })
    .from(reflections)
    .where(eq(reflections.userId, userId))
    .orderBy(desc(reflections.entryDate))
    .limit(limit);
  return rows.map((r) => r.entryDate);
}
