// 阶段目标 API helper —— 真实后端，组件通过它读写。

"use client";

import { request } from "@/lib/api/request";
import type { GoalKind } from "@/lib/goals/types";

export interface TaskDTO {
  id: string;
  orderIndex: number;
  name: string;
  dailyTarget: number;
  dailyUnit: string;
  icon: string;
  checkedDays: string[];
}

export interface StageDTO {
  id: string;
  orderIndex: number;
  name: string;
  focus: string;
  startDate: string;
  endDate: string;
  milestoneValue: number | null;
  icon: string;
  tasks: TaskDTO[];
}

export interface GoalDTO {
  id: string;
  title: string;
  kind: string;
  startLevel: string;
  startValue: number | null;
  targetValue: number | null;
  valueUnit: string | null;
  direction: string;
  startDate: string;
  deadline: string;
  status: string;
  currentValue: number | null;
  stages: StageDTO[];
}

export interface CreateGoalInput {
  title: string;
  kind: GoalKind;
  deadline: string;
  startLevel?: string;
  startValue?: number | null;
  targetValue?: number | null;
  valueUnit?: string | null;
}

export async function listGoals(): Promise<GoalDTO[]> {
  const res = await request("/api/goals", { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { goals?: GoalDTO[] };
  return data.goals ?? [];
}

export async function createGoal(
  input: CreateGoalInput,
): Promise<{ goal: GoalDTO | null; source: "ai" | "fallback" }> {
  const res = await request("/api/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { goal: GoalDTO | null; source: "ai" | "fallback" };
  return { goal: data.goal, source: data.source };
}

export async function deleteGoal(id: string): Promise<void> {
  const res = await request(`/api/goals?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function checkInTask(
  goalId: string,
  stageId: string,
  taskId: string,
  logDate: string,
): Promise<void> {
  const res = await request("/api/goals/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goalId, stageId, taskId, logDate }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function undoTaskCheckIn(
  goalId: string,
  stageId: string,
  taskId: string,
  logDate: string,
): Promise<void> {
  const res = await request("/api/goals/checkin", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goalId, stageId, taskId, logDate }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function recordMeasurement(
  goalId: string,
  value: number,
): Promise<void> {
  const res = await request("/api/goals/measure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goalId, value }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function replanGoal(
  goalId: string,
  pace?: "behind" | "ahead",
): Promise<{ replanned: boolean; goal: GoalDTO | null }> {
  const res = await request("/api/goals/replan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goalId, pace }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { replanned: boolean; goal?: GoalDTO | null };
  return { replanned: data.replanned, goal: data.goal ?? null };
}
