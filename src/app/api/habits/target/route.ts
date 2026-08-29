import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateHabitTarget, habitBelongsToUser } from "@/lib/db/queries/habits";
import { MAX_TARGET } from "@/lib/habits/growth";

// 调整某个习惯的每日目标量（加量采纳，或「有点难」下调）。
// 客户端传入已由加量引擎算好的 targetAmount 与当前 streak（作为 lastBumpStreak 基准）。
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const habitId = String(body?.habitId ?? "");
  const targetAmount = Number(body?.targetAmount);
  const lastBumpStreak = Number(body?.lastBumpStreak ?? 0);

  if (
    !habitId ||
    !Number.isFinite(targetAmount) ||
    targetAmount < 1 ||
    targetAmount > MAX_TARGET ||
    !Number.isFinite(lastBumpStreak) ||
    lastBumpStreak < 0
  ) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  if (!(await habitBelongsToUser(habitId, auth.user.id))) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const habit = await updateHabitTarget({
    id: habitId,
    userId: auth.user.id,
    targetAmount: Math.round(targetAmount),
    lastBumpStreak: Math.round(lastBumpStreak),
  });
  return NextResponse.json({ ok: true, habit });
}
