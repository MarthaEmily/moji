// 每日健身时间块 API helper —— 真实后端，组件通过它读写。

"use client";

import { request } from "@/lib/api/request";

export interface WorkoutDayState {
  day: string;
  baseMinutes: number;
  shiftedMinutes: number;
  completed: boolean;
}

/** 读取某日健身状态；若尚无记录，服务端会以 baseMinutes 落库并返回。 */
export async function getWorkoutDay(
  day: string,
  baseMinutes: number,
): Promise<WorkoutDayState> {
  const res = await request(
    `/api/workout?day=${encodeURIComponent(day)}&base=${Math.round(baseMinutes)}`,
    { method: "GET" },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { workout: WorkoutDayState };
  return data.workout;
}

/** 持久化后移后的目标时间。 */
export async function shiftWorkoutDay(
  day: string,
  shiftedMinutes: number,
): Promise<WorkoutDayState> {
  const res = await request("/api/workout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ day, action: "shift", shiftedMinutes }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { workout: WorkoutDayState };
  return data.workout;
}

/** 标记完成 / 取消完成。 */
export async function setWorkoutCompleted(
  day: string,
  completed: boolean,
): Promise<WorkoutDayState> {
  const res = await request("/api/workout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ day, action: "complete", completed }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { workout: WorkoutDayState };
  return data.workout;
}
