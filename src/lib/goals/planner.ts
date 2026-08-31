// 服务端规划器：调用 AI 拆分，失败则用内置模板；再把阶段分配到具体日期。
import { appAi, AppAIUnavailableError } from "@/lib/eazo-ai-billing";
import {
  GOAL_PLAN_SYSTEM,
  buildPlanUserPrompt,
  sanitizeStages,
  fallbackPlan,
} from "@/lib/goals/plan";
import {
  assignDates,
  daysBetween,
  type DatedStage,
  type GoalPlanInput,
} from "@/lib/goals/types";

export async function planStages(
  input: GoalPlanInput,
  startDate: string,
  deadline: string,
): Promise<{ stages: DatedStage[]; source: "ai" | "fallback" }> {
  const fallback = fallbackPlan(input);
  try {
    const completion = await appAi.chat({
      messages: [
        { role: "system", content: GOAL_PLAN_SYSTEM },
        { role: "user", content: buildPlanUserPrompt(input) },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices?.[0]?.message?.content ?? "";
    const parsed = safeParse(raw);
    const stages = sanitizeStages(parsed.stages);
    const chosen = stages.length >= 2 ? stages : fallback;
    return {
      stages: assignDates(chosen, startDate, deadline),
      source: stages.length >= 2 ? "ai" : "fallback",
    };
  } catch (error) {
    if (!(error instanceof AppAIUnavailableError)) {
      console.error("[goals/plan] error", error);
    }
    return { stages: assignDates(fallback, startDate, deadline), source: "fallback" };
  }
}

export { daysBetween };

function safeParse(raw: string): { stages?: unknown } {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as { stages?: unknown }) : {};
  } catch {
    return {};
  }
}
