import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getOrCreateWorkoutDay,
  shiftWorkoutDay,
  setWorkoutCompleted,
} from "@/lib/db/queries/workout";
import type { WorkoutDay } from "@/lib/db/schema/workout";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toState(w: WorkoutDay) {
  return {
    day: w.day,
    baseMinutes: w.baseMinutes,
    shiftedMinutes: w.shiftedMinutes,
    completed: w.completed,
  };
}

// GET /api/workout?day=YYYY-MM-DD&base=<minutes>
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const day = String(url.searchParams.get("day") ?? "");
  const base = Number(url.searchParams.get("base"));
  if (!DATE_RE.test(day) || !Number.isFinite(base)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  const baseMinutes = Math.max(0, Math.min(1440, Math.round(base)));
  const w = await getOrCreateWorkoutDay({ userId: auth.user.id, day, baseMinutes });
  return NextResponse.json({ ok: true, workout: toState(w) });
}

// POST /api/workout  { day, action: "shift" | "complete", ... }
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const day = String(body?.day ?? "");
  const action = String(body?.action ?? "");
  if (!DATE_RE.test(day)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  let w: WorkoutDay | undefined;
  if (action === "shift") {
    const shifted = Number(body?.shiftedMinutes);
    if (!Number.isFinite(shifted)) {
      return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
    }
    w = await shiftWorkoutDay({ userId: auth.user.id, day, shiftedMinutes: shifted });
  } else if (action === "complete") {
    const completed = Boolean(body?.completed);
    w = await setWorkoutCompleted({ userId: auth.user.id, day, completed });
  } else {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  if (!w) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, workout: toState(w) });
}
