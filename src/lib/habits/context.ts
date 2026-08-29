// 把用户的习惯与近期打卡汇总成一段简短中文，供心得 AI 参考（不暴露给用户）。
import { computeStreak, isCheckedToday } from "./streak";

interface HabitLike {
  name: string;
  targetAmount: number;
  unit: string;
  logDates: string[];
}

/**
 * 生成给 AI 的打卡上下文摘要。刻意保持简短、只讲事实，
 * 不做评判（评判交给带人格的 system prompt）。
 */
export function buildHabitContext(habits: HabitLike[], today: string): string {
  if (habits.length === 0) {
    return "用户目前还没有创建任何习惯。";
  }

  const lines = habits.map((h) => {
    const streak = computeStreak(h.logDates, today);
    const done = isCheckedToday(h.logDates, today);
    const last7 = h.logDates.filter((d) => d <= today).slice(0, 7).length;
    return `「${h.name}」目标每天 ${h.targetAmount}${h.unit}；今日${
      done ? "已打卡" : "未打卡"
    }；当前连续 ${streak} 天；近 7 天完成 ${last7} 次。`;
  });

  const pending = habits.filter((h) => !isCheckedToday(h.logDates, today)).length;
  const header = `用户共有 ${habits.length} 个习惯，今天还有 ${pending} 个未打卡。`;
  return [header, ...lines].join("\n");
}
