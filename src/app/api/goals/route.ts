import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  listGoalsWithStages,
  createGoal,
  insertStages,
  deleteGoalForUser,
} from "@/lib/db/queries/goals";
import { planStages } from "@/lib/goals/planner";
import { daysBetween, localDate, type GoalKind } from "@/lib/goals/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const KINDS = ["study", "exam", "weight", "fitness", "skill", "other"];

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const goals = await listGoalsWithStages(auth.user.id);
  return NextResponse.json({ ok: true, goals });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const kind = (KINDS.includes(String(body?.kind)) ? body.kind : "other") as GoalKind;
  const deadline = String(body?.deadline ?? "");
  const startLevel = String(body?.startLevel ?? "").trim().slice(0, 120);
  const startDate = localDate();

  if (!title || title.length > 60 || !DATE_RE.test(deadline) || deadline <= startDate) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const sv = body?.startValue == null ? null : Number(body.startValue);
  const tv = body?.targetValue == null ? null : Number(body.targetValue);
  const startValue = Number.isFinite(sv as number) ? (sv as number) : null;
  const targetValue = Number.isFinite(tv as number) ? (tv as number) : null;
  const valueUnit = body?.valueUnit ? String(body.valueUnit).slice(0, 24) : null;
  const direction =
    startValue != null && targetValue != null && targetValue < startValue
      ? "down"
      : "up";

  const daysRemaining = daysBetween(startDate, deadline);

  const { stages, source } = await planStages(
    { title, kind, startLevel, startValue, targetValue, valueUnit, direction, daysRemaining },
    startDate,
    deadline,
  );

  const goal = await createGoal({
    userId: auth.user.id,
    title,
    kind,
    startLevel,
    startValue,
    targetValue,
    valueUnit,
    direction,
    startDate,
    deadline,
  });

  await insertStages(
    auth.user.id,
    goal.id,
    stages.map((s) => ({
      orderIndex: s.orderIndex,
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
    })),
  );

  const goals = await listGoalsWithStages(auth.user.id);
  const created = goals.find((g) => g.id === goal.id) ?? null;
  return NextResponse.json({ ok: true, goal: created, source });
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const id = String(url.searchParams.get("id") ?? "");
  if (!id) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  const ok = await deleteGoalForUser(id, auth.user.id);
  if (!ok) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
