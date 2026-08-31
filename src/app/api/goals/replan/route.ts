import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  listGoalsWithStages,
  replaceRemainingStages,
} from "@/lib/db/queries/goals";
import { planStages } from "@/lib/goals/planner";
import { daysBetween, localDate, type GoalKind } from "@/lib/goals/types";

// POST /api/goals/replan { goalId, pace?: "behind" | "ahead" }
// 从「今天所处/下一个」阶段起重拆剩余路程，保留已完成的历史阶段。
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const goalId = String(body?.goalId ?? "");
  const pace = body?.pace === "behind" || body?.pace === "ahead" ? body.pace : null;
  if (!goalId) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const goals = await listGoalsWithStages(auth.user.id);
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const today = localDate();
  if (goal.deadline <= today) {
    // 已到截止日，无可重拆的剩余路程。
    return NextResponse.json({ ok: true, replanned: false, reason: "deadline_passed" });
  }

  // 找到「今天所处或之后」的第一个阶段，作为重拆起点；它之前的阶段保留为历史。
  const sorted = [...goal.stages].sort((a, b) => a.orderIndex - b.orderIndex);
  const firstFuture = sorted.find((s) => s.endDate >= today);
  const fromOrder = firstFuture ? firstFuture.orderIndex : sorted.length;

  const daysRemaining = daysBetween(today, goal.deadline);

  // 把偏差作为提示注入标题上下文，让 AI 落后补基础/超前提量。
  const paceHint =
    pace === "behind"
      ? "（学习进度偏慢，请放缓节奏、补牢基础，把量往后压，别制造压力）"
      : pace === "ahead"
        ? "（进度超前，可适当提量、拔高阶段目标，稳步冲刺）"
        : "";

  const { stages, source } = await planStages(
    {
      title: goal.title + paceHint,
      kind: goal.kind as GoalKind,
      startLevel: goal.startLevel,
      startValue: goal.currentValue ?? goal.startValue,
      targetValue: goal.targetValue,
      valueUnit: goal.valueUnit,
      direction: goal.direction as "up" | "down",
      daysRemaining,
    },
    today,
    goal.deadline,
  );

  // 新阶段 orderIndex 从 fromOrder 起顺延。
  const renumbered = stages.map((s, i) => ({
    orderIndex: fromOrder + i,
    name: s.name,
    focus: s.focus,
    startDate: s.startDate,
    endDate: s.endDate,
    milestoneValue: s.milestoneValue,
    icon: s.icon,
    tasks: s.tasks.map((tk, ti) => ({
      orderIndex: ti,
      name: tk.name,
      dailyTarget: tk.dailyTarget,
      dailyUnit: tk.dailyUnit,
      icon: tk.icon,
    })),
  }));

  await replaceRemainingStages(auth.user.id, goalId, fromOrder, renumbered);

  const refreshed = await listGoalsWithStages(auth.user.id);
  const updated = refreshed.find((g) => g.id === goalId) ?? null;
  return NextResponse.json({ ok: true, replanned: true, goal: updated, source });
}
