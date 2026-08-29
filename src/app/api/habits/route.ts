import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { upsertUser } from "@/lib/db/queries";
import {
  listHabitsWithLogs,
  createHabit,
  deleteHabitForUser,
} from "@/lib/db/queries/habits";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const habits = await listHabitsWithLogs(auth.user.id);
  return NextResponse.json({ ok: true, habits });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const targetAmount = Number(body?.targetAmount);
  const unit = String(body?.unit ?? "次").trim() || "次";
  const icon = String(body?.icon ?? "sparkles").trim() || "sparkles";

  if (!name || name.length > 40 || !Number.isFinite(targetAmount) || targetAmount < 1) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  await upsertUser({
    id: auth.user.id,
    email: auth.user.email,
    name: auth.user.name,
    avatarUrl: auth.user.avatarUrl,
  });

  const habit = await createHabit({
    userId: auth.user.id,
    name,
    targetAmount: Math.round(targetAmount),
    unit: unit.slice(0, 24),
    icon: icon.slice(0, 32),
  });
  return NextResponse.json({ ok: true, habit });
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }
  const deleted = await deleteHabitForUser(id, auth.user.id);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
