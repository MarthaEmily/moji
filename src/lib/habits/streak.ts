// 习惯打卡的纯计算工具：本地自然日、今日是否打卡、连续天数（streak）。

/** 返回本地时区的 YYYY-MM-DD */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDay(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return localDateStr(dt);
}

/** 今日是否已打卡 */
export function isCheckedToday(logDates: string[], today = localDateStr()): boolean {
  return logDates.includes(today);
}

/**
 * 连续天数：从今天（若今天已打卡）或昨天开始，往回数连续打卡的天数。
 * 今天没打卡但昨天打了，仍算作当前 streak（保留到今天结束前的机会）。
 */
export function computeStreak(logDates: string[], today = localDateStr()): number {
  if (logDates.length === 0) return 0;
  const set = new Set(logDates);

  let cursor: string;
  if (set.has(today)) {
    cursor = today;
  } else if (set.has(shiftDay(today, -1))) {
    cursor = shiftDay(today, -1);
  } else {
    return 0;
  }

  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}
