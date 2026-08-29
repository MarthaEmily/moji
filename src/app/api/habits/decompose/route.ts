import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { appAi, AppAIUnavailableError } from "@/lib/eazo-ai-billing";
import {
  fallbackDecompose,
  sanitizeSuggestions,
  type SubHabitSuggestion,
} from "@/lib/habits/decompose-fallback";

const SYSTEM = `你是一位习惯养成教练。用户给你一个较大的目标，你要把它拆解成 3-5 个每天可执行的小习惯。
关键原则：每个子习惯的起步量要非常小、极易完成（例如"背 5 个单词"、"深蹲 1 分钟"），让用户几乎不可能失败，之后再靠加量成长。
每个子习惯包含：name（简短中文名，≤10字）、targetAmount（正整数起步量，尽量小）、unit（单位，如"个/分钟/段/次"）、icon（从这些里选一个最贴切的：book, dumbbell, water, steps, brain, pen, moon, language, apple, sparkles）。
只返回 JSON 对象，形如 {"subHabits":[{"name":"背单词","targetAmount":5,"unit":"个","icon":"language"}]}，不要任何多余文字。`;

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const goal = String(body?.goal ?? "").trim();
  if (!goal || goal.length > 60) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const fallback = fallbackDecompose(goal);

  try {
    const completion = await appAi.chat({
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `目标：${goal}` },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices?.[0]?.message?.content ?? "";
    const parsed = safeParse(raw);
    const suggestions = sanitizeSuggestions(parsed.subHabits);
    const result: SubHabitSuggestion[] = suggestions.length > 0 ? suggestions : fallback;
    return NextResponse.json({ ok: true, subHabits: result, source: suggestions.length ? "ai" : "fallback" });
  } catch (error) {
    if (error instanceof AppAIUnavailableError) {
      return NextResponse.json({ ok: true, subHabits: fallback, source: "fallback" });
    }
    console.error("[decompose] error", error);
    return NextResponse.json({ ok: true, subHabits: fallback, source: "fallback" });
  }
}

function safeParse(raw: string): { subHabits?: unknown } {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as { subHabits?: unknown }) : {};
  } catch {
    return {};
  }
}
