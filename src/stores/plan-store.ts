import type { WorkoutWindow } from "@/lib/schedule/engine";

export interface SavedPlan {
  id: string;
  wakeMinutes: number;
  sleepHours: number;
  workoutWindow: WorkoutWindow;
  createdAt: string; // ISO
}

export interface PlanInput {
  wakeMinutes: number;
  sleepHours: number;
  workoutWindow: WorkoutWindow;
}

export const DEFAULT_PLAN_INPUT: PlanInput = {
  wakeMinutes: 7 * 60,
  sleepHours: 8,
  workoutWindow: "evening",
};
