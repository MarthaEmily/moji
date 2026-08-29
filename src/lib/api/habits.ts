// 习惯打卡 API helper —— 真实后端，组件通过它读写（不直接 fetch）。

"use client";

import { request } from "@/lib/api/request";

export interface HabitWithLogs {
  id: string;
  name: string;
  targetAmount: number;
  baseAmount: number;
  lastBumpStreak: number;
  unit: string;
  icon: string;
  createdAt: string;
  logDates: string[];
}

export interface CreateHabitInput {
  name: string;
  targetAmount: number;
  unit: string;
  icon: string;
}

export async function listHabits(): Promise<HabitWithLogs[]> {
  const res = await request("/api/habits", { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { habits?: HabitWithLogs[] };
  return data.habits ?? [];
}

export async function createHabit(input: CreateHabitInput): Promise<HabitWithLogs> {
  const res = await request("/api/habits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { habit: Omit<HabitWithLogs, "logDates"> };
  return { ...data.habit, logDates: [] };
}

export async function deleteHabit(id: string): Promise<void> {
  const res = await request(`/api/habits?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function checkInHabit(habitId: string, logDate: string): Promise<void> {
  const res = await request("/api/habits/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ habitId, logDate }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function undoCheckIn(habitId: string, logDate: string): Promise<void> {
  const res = await request("/api/habits/checkin", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ habitId, logDate }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export interface SubHabitSuggestion {
  name: string;
  targetAmount: number;
  unit: string;
  icon: string;
}

/** AI 拆解大目标为子习惯建议（不落库） */
export async function decomposeGoal(goal: string): Promise<{
  subHabits: SubHabitSuggestion[];
  source: "ai" | "fallback";
}> {
  const res = await request("/api/habits/decompose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as {
    subHabits?: SubHabitSuggestion[];
    source?: "ai" | "fallback";
  };
  return { subHabits: data.subHabits ?? [], source: data.source ?? "fallback" };
}

/** 批量创建习惯，返回新建的习惯（已带空 logDates） */
export async function batchCreateHabits(
  subHabits: SubHabitSuggestion[],
): Promise<HabitWithLogs[]> {
  const res = await request("/api/habits/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subHabits }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { habits?: Omit<HabitWithLogs, "logDates">[] };
  return (data.habits ?? []).map((h) => ({ ...h, logDates: [] }));
}

/** 调整目标量（采纳加量或下调）；lastBumpStreak 传当前连续天数作为基准 */
export async function adjustHabitTarget(
  habitId: string,
  targetAmount: number,
  lastBumpStreak: number,
): Promise<void> {
  const res = await request("/api/habits/target", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ habitId, targetAmount, lastBumpStreak }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
