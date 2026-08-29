// 作息方案 API helper —— 真实后端实现。
// 组件调用这些类型化 helper（不直接 fetch），内部走模板 request()（注入 session）。

"use client";

import { request } from "@/lib/api/request";
import { AppAIClientUnavailableError } from "@/lib/api/app-ai-request";
import type { NodeKey, ScheduleResult, WorkoutWindow } from "@/lib/schedule/engine";
import { FALLBACK_RATIONALE } from "@/lib/schedule/rationale";
import type { PlanInput, SavedPlan } from "@/stores/plan-store";

// ---- AI 科学依据 ----

export interface RationaleRequest {
  result: ScheduleResult;
}
export type RationaleMap = Record<NodeKey, string>;

/** 为每个节点生成一句科学依据。AI 不可用时回退到内置文案，保证方案照常展示。 */
export async function generateRationales(
  req: RationaleRequest,
): Promise<RationaleMap> {
  const { input } = req.result;
  try {
    const res = await request("/api/rationale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wakeMinutes: input.wakeMinutes,
        sleepHours: input.sleepHours,
        workoutWindow: input.workoutWindow,
      }),
    });
    if (!res.ok) return { ...FALLBACK_RATIONALE };
    const data = (await res.json()) as { rationales?: RationaleMap };
    return data.rationales ?? { ...FALLBACK_RATIONALE };
  } catch (error) {
    if (error instanceof AppAIClientUnavailableError) return { ...FALLBACK_RATIONALE };
    return { ...FALLBACK_RATIONALE };
  }
}

// ---- 保存的方案（真实持久化，按登录用户隔离）----

interface PlanApiRow {
  id: string;
  wakeMinutes: number;
  sleepHours: number;
  workoutWindow: WorkoutWindow;
  createdAt: string;
}

export async function listPlans(): Promise<SavedPlan[]> {
  const res = await request("/api/plans", { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { plans?: PlanApiRow[] };
  return (data.plans ?? []).map(normalize);
}

export async function savePlan(input: PlanInput): Promise<SavedPlan> {
  const res = await request("/api/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { plan: PlanApiRow };
  return normalize(data.plan);
}

export async function deletePlan(id: string): Promise<void> {
  const res = await request(`/api/plans?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

function normalize(row: PlanApiRow): SavedPlan {
  return {
    id: row.id,
    wakeMinutes: row.wakeMinutes,
    sleepHours: row.sleepHours,
    workoutWindow: row.workoutWindow,
    createdAt: row.createdAt,
  };
}

export type { PlanInput, SavedPlan, WorkoutWindow };
