import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { upsertUser } from "@/lib/db/queries";
import { createHabitsBatch } from "@/lib/db/queries/habits";
import { sanitizeSuggestions } from "@/lib/habits/decompose-fallback";

// 批量创建习惯（AI 拆解一键添加）。最多 6 个。
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const items = sanitizeSuggestions(body?.subHabits);
  if (items.length === 0) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  await upsertUser({
    id: auth.user.id,
    email: auth.user.email,
    name: auth.user.name,
    avatarUrl: auth.user.avatarUrl,
  });

  const created = await createHabitsBatch(auth.user.id, items);
  return NextResponse.json({ ok: true, habits: created });
}
