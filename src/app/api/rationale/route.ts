import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { appAi, AppAIUnavailableError } from "@/lib/eazo-ai-billing";
import { computeSchedule, formatTime, NODE_TITLES, type WorkoutWindow } from "@/lib/schedule/engine";
import { FALLBACK_RATIONALE } from "@/lib/schedule/rationale";
import type { NodeKey } from "@/lib/schedule/engine";

const WINDOWS = ["morning", "noon", "evening"] as const;
const NODE_KEYS: NodeKey[] = ["wake", "breakfast", "lunch", "workout", "dinner", "bedtime"];

const SYSTEM = `你是一位循证的作息与睡眠健康教练。用户会提供一份已经算好的一日作息（六个时间点）。
你的任务：为每个节点写一句"科学依据"，解释为什么把它安排在这个时间，结合用户的具体作息措辞。
要求：每句 20-45 个中文字，口吻温和、可信、有依据；不要重复节点名称开头，不要用"建议""应该"等空话；直接说原理。
只返回 JSON 对象，键为 wake/breakfast/lunch/workout/dinner/bedtime，值为对应中文句子，不要任何多余文字。`;

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const wakeMinutes = Number(body?.wakeMinutes);
  const sleepHours = Number(body?.sleepHours);
  const workoutWindow = String(body?.workoutWindow) as WorkoutWindow;

  if (
    !Number.isFinite(wakeMinutes) ||
    !Number.isFinite(sleepHours) ||
    !WINDOWS.includes(workoutWindow as (typeof WINDOWS)[number])
  ) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const result = computeSchedule({ wakeMinutes, sleepHours, workoutWindow });
  const scheduleText = result.nodes
    .map((n) => `${NODE_TITLES[n.key]}(${n.key}) ${formatTime(n.minutes)}`)
    .join("，");
  const userMsg = `起床后目标睡眠 ${sleepHours} 小时，健身偏好${
    workoutWindow === "morning" ? "早晨" : workoutWindow === "noon" ? "中午" : "傍晚"
  }。今日作息：${scheduleText}。请为这六个节点各写一句科学依据。`;

  try {
    const completion = await appAi.chat({
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userMsg },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices?.[0]?.message?.content ?? "";
    const parsed = safeParse(raw);
    const rationales = buildMap(parsed);
    return NextResponse.json({ ok: true, rationales, source: "ai" });
  } catch (error) {
    if (error instanceof AppAIUnavailableError) {
      return NextResponse.json({ ok: true, rationales: { ...FALLBACK_RATIONALE }, source: "fallback" });
    }
    console.error("[rationale] error", error);
    return NextResponse.json({ ok: true, rationales: { ...FALLBACK_RATIONALE }, source: "fallback" });
  }
}

function safeParse(raw: string): Record<string, unknown> {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function buildMap(parsed: Record<string, unknown>): Record<NodeKey, string> {
  const out = {} as Record<NodeKey, string>;
  for (const key of NODE_KEYS) {
    const v = parsed[key];
    out[key] = typeof v === "string" && v.trim() ? v.trim() : FALLBACK_RATIONALE[key];
  }
  return out;
}
