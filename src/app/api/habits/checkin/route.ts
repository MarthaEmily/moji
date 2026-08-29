import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  habitBelongsToUser,
  checkInHabit,
  undoCheckIn,
} from "@/lib/db/queries/habits";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function parse(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const habitId = String(body?.habitId ?? "");
  const logDate = String(body?.logDate ?? "");
  if (!habitId || !DATE_RE.test(logDate)) return null;
  return { habitId, logDate };
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const input = await parse(request);
  if (!input) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  if (!(await habitBelongsToUser(input.habitId, auth.user.id))) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  await checkInHabit({ ...input, userId: auth.user.id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const input = await parse(request);
  if (!input) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  if (!(await habitBelongsToUser(input.habitId, auth.user.id))) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  await undoCheckIn({ ...input, userId: auth.user.id });
  return NextResponse.json({ ok: true });
}
