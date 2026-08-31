import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { goalBelongsToUser, recordMeasurement } from "@/lib/db/queries/goals";
import { localDate } from "@/lib/goals/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const goalId = String(body?.goalId ?? "");
  const value = Number(body?.value);
  const measuredOn = body?.measuredOn ? String(body.measuredOn) : localDate();

  if (!goalId || !Number.isFinite(value) || !DATE_RE.test(measuredOn)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  if (!(await goalBelongsToUser(goalId, auth.user.id))) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  await recordMeasurement({ userId: auth.user.id, goalId, measuredOn, value });
  return NextResponse.json({ ok: true });
}
