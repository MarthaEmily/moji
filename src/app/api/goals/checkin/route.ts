import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  taskBelongsToUser,
  checkInTask,
  undoTaskCheckIn,
} from "@/lib/db/queries/goals";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function parse(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const goalId = String(body?.goalId ?? "");
  const stageId = String(body?.stageId ?? "");
  const taskId = String(body?.taskId ?? "");
  const logDate = String(body?.logDate ?? "");
  if (!goalId || !stageId || !taskId || !DATE_RE.test(logDate)) return null;
  return { goalId, stageId, taskId, logDate };
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const input = await parse(request);
  if (!input) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  if (!(await taskBelongsToUser(input.taskId, auth.user.id))) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  await checkInTask({ ...input, userId: auth.user.id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const input = await parse(request);
  if (!input) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  if (!(await taskBelongsToUser(input.taskId, auth.user.id))) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  await undoTaskCheckIn({
    userId: auth.user.id,
    taskId: input.taskId,
    logDate: input.logDate,
  });
  return NextResponse.json({ ok: true });
}
