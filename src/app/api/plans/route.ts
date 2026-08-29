import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { upsertUser } from "@/lib/db/queries";
import {
  listPlansByUser,
  createPlan,
  deletePlanForUser,
} from "@/lib/db/queries/plans";

const WINDOWS = ["morning", "noon", "evening"] as const;

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const rows = await listPlansByUser(auth.user.id);
  return NextResponse.json({ ok: true, plans: rows });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const wakeMinutes = Number(body?.wakeMinutes);
  const sleepHours = Number(body?.sleepHours);
  const workoutWindow = String(body?.workoutWindow);

  if (
    !Number.isFinite(wakeMinutes) ||
    wakeMinutes < 0 ||
    wakeMinutes > 1439 ||
    !Number.isFinite(sleepHours) ||
    sleepHours < 3 ||
    sleepHours > 14 ||
    !WINDOWS.includes(workoutWindow as (typeof WINDOWS)[number])
  ) {
    return NextResponse.json(
      { ok: false, error: "invalid_input" },
      { status: 400 },
    );
  }

  // 确保本地用户存在（外键约束）
  await upsertUser({
    id: auth.user.id,
    email: auth.user.email,
    name: auth.user.name,
    avatarUrl: auth.user.avatarUrl,
  });

  const row = await createPlan({
    userId: auth.user.id,
    wakeMinutes: Math.round(wakeMinutes),
    sleepHours,
    workoutWindow,
  });
  return NextResponse.json({ ok: true, plan: row });
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }
  const deleted = await deletePlanForUser(id, auth.user.id);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
