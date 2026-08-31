"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useEazo } from "@eazo/sdk/react";
import {
  listGoals,
  createGoal as apiCreateGoal,
  deleteGoal as apiDeleteGoal,
  checkInTask,
  undoTaskCheckIn,
  recordMeasurement,
  replanGoal,
  type GoalDTO,
  type StageDTO,
  type TaskDTO,
  type CreateGoalInput,
} from "@/lib/api/goals";
import {
  computeStageProgress,
  shouldReplan,
  sumCheckedUnits,
} from "@/lib/goals/progress";
import { localDate, type GoalDirection } from "@/lib/goals/types";

// 判断某目标当前是否需要自动重拆，并给出偏差方向。
function replanNeed(goal: GoalDTO): { need: boolean; pace?: "behind" | "ahead" } {
  const today = localDate();
  const sorted = [...goal.stages].sort((a, b) => a.orderIndex - b.orderIndex);
  const current = sorted.find((s) => s.endDate >= today);
  if (!current) return { need: goal.deadline > today }; // 阶段都过期但还没到截止 -> 需要重拆
  const p = computeStageProgress({
    startDate: current.startDate,
    endDate: current.endDate,
    checkedUnits: sumCheckedUnits(current.tasks, current.startDate, today),
    taskCount: current.tasks.length,
    today,
    startValue: goal.startValue,
    currentValue: goal.currentValue,
    milestoneValue: current.milestoneValue,
    direction: goal.direction as GoalDirection,
  });
  if (!shouldReplan(p)) return { need: false };
  return { need: true, pace: p.pace === "on-track" ? undefined : p.pace };
}

export function useGoals(t: (k: string, o?: Record<string, unknown>) => string) {
  const user = useEazo((s) => s.auth.user);
  const [goals, setGoals] = useState<GoalDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  // 记录本会话已尝试自动重拆过的目标，避免重复触发。
  const replannedRef = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setGoals(await listGoals());
    } catch {
      // 静默：目标区非核心，失败不打扰
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  // 自动重拆：加载后检查每个目标，需要则静默重拆一次。
  useEffect(() => {
    if (loading || goals.length === 0) return;
    for (const g of goals) {
      if (replannedRef.current.has(g.id)) continue;
      const { need, pace } = replanNeed(g);
      if (!need) continue;
      replannedRef.current.add(g.id);
      replanGoal(g.id, pace)
        .then((res) => {
          if (res.replanned && res.goal) {
            setGoals((prev) => prev.map((x) => (x.id === g.id ? res.goal! : x)));
            toast(t("goals.toastReplanned"), { icon: "🧭" });
          }
        })
        .catch(() => undefined);
    }
  }, [loading, goals, t]);

  const create = async (input: CreateGoalInput) => {
    setCreating(true);
    try {
      const { goal } = await apiCreateGoal(input);
      if (goal) setGoals((prev) => [goal, ...prev]);
      toast.success(t("goals.toastCreated"));
      return true;
    } catch {
      toast.error(t("goals.toastCreateError"));
      return false;
    } finally {
      setCreating(false);
    }
  };

  const remove = async (goal: GoalDTO) => {
    if (!window.confirm(t("goals.deleteConfirm"))) return;
    setBusyId(goal.id);
    try {
      await apiDeleteGoal(goal.id);
      setGoals((prev) => prev.filter((g) => g.id !== goal.id));
      toast.success(t("goals.toastDeleted"));
    } catch {
      toast.error(t("goals.toastError"));
    } finally {
      setBusyId(null);
    }
  };

  const toggleTask = async (
    goal: GoalDTO,
    stage: StageDTO,
    task: TaskDTO,
    checked: boolean,
  ) => {
    const today = localDate();
    setBusyId(goal.id);
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id
          ? {
              ...g,
              stages: g.stages.map((s) =>
                s.id === stage.id
                  ? {
                      ...s,
                      tasks: s.tasks.map((tk) =>
                        tk.id === task.id
                          ? {
                              ...tk,
                              checkedDays: checked
                                ? [today, ...tk.checkedDays.filter((d) => d !== today)]
                                : tk.checkedDays.filter((d) => d !== today),
                            }
                          : tk,
                      ),
                    }
                  : s,
              ),
            }
          : g,
      ),
    );
    try {
      if (checked) {
        await checkInTask(goal.id, stage.id, task.id, today);
        toast.success(t("goals.toastCheckIn"));
      } else {
        await undoTaskCheckIn(goal.id, stage.id, task.id, today);
      }
    } catch {
      toast.error(t("goals.toastError"));
      void load();
    } finally {
      setBusyId(null);
    }
  };

  const measure = async (goal: GoalDTO, value: number) => {
    setBusyId(goal.id);
    setGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, currentValue: value } : g)),
    );
    try {
      await recordMeasurement(goal.id, value);
      toast.success(t("goals.toastMeasured"));
      // 记数值后允许重新评估是否需要重拆。
      replannedRef.current.delete(goal.id);
      void load();
    } catch {
      toast.error(t("goals.toastError"));
      void load();
    } finally {
      setBusyId(null);
    }
  };

  return {
    goals,
    loading,
    creating,
    busyId,
    create,
    remove,
    toggleTask,
    measure,
  };
}
