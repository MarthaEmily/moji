// 大任务拆解的共享类型与内置回退模板（AI 不可用或解析失败时使用）。

export interface SubHabitSuggestion {
  name: string;
  targetAmount: number;
  unit: string;
  icon: string;
}

// 关键词 → 内置子习惯模板。命中任一关键词即返回对应模板。
const TEMPLATES: { keywords: string[]; subs: SubHabitSuggestion[] }[] = [
  {
    keywords: ["英语", "english", "外语", "语言", "japanese", "日语", "韩语"],
    subs: [
      { name: "背单词", targetAmount: 5, unit: "个", icon: "language" },
      { name: "语法练习", targetAmount: 5, unit: "分钟", icon: "pen" },
      { name: "精读一段", targetAmount: 1, unit: "段", icon: "book" },
      { name: "听力", targetAmount: 3, unit: "分钟", icon: "brain" },
    ],
  },
  {
    keywords: ["健身", "锻炼", "运动", "减肥", "塑形", "fitness", "workout", "gym"],
    subs: [
      { name: "深蹲", targetAmount: 1, unit: "分钟", icon: "dumbbell" },
      { name: "拉伸", targetAmount: 3, unit: "分钟", icon: "steps" },
      { name: "快走", targetAmount: 5, unit: "分钟", icon: "steps" },
    ],
  },
  {
    keywords: ["阅读", "读书", "看书", "reading", "book"],
    subs: [
      { name: "阅读", targetAmount: 10, unit: "分钟", icon: "book" },
      { name: "记读书笔记", targetAmount: 1, unit: "条", icon: "pen" },
    ],
  },
  {
    keywords: ["写作", "文章", "日记", "writing", "blog"],
    subs: [
      { name: "自由写作", targetAmount: 50, unit: "字", icon: "pen" },
      { name: "读优秀范文", targetAmount: 1, unit: "篇", icon: "book" },
    ],
  },
  {
    keywords: ["早睡", "作息", "睡眠", "sleep"],
    subs: [
      { name: "睡前放下手机", targetAmount: 10, unit: "分钟", icon: "moon" },
      { name: "喝水", targetAmount: 6, unit: "杯", icon: "water" },
    ],
  },
];

/** 通用兜底：任何目标都给一组极小的起步子任务 */
const GENERIC: SubHabitSuggestion[] = [
  { name: "专注投入", targetAmount: 5, unit: "分钟", icon: "brain" },
  { name: "复盘记录", targetAmount: 1, unit: "条", icon: "pen" },
];

/** 根据目标文本返回内置回退拆解 */
export function fallbackDecompose(goal: string): SubHabitSuggestion[] {
  const text = goal.toLowerCase();
  for (const tpl of TEMPLATES) {
    if (tpl.keywords.some((k) => text.includes(k.toLowerCase()))) {
      return tpl.subs;
    }
  }
  return GENERIC;
}

const VALID_ICONS = new Set([
  "sparkles",
  "book",
  "dumbbell",
  "water",
  "steps",
  "brain",
  "pen",
  "moon",
  "language",
  "apple",
]);

/** 清洗 AI 返回的子习惯（限制字段、范围、图标白名单），最多 6 条 */
export function sanitizeSuggestions(raw: unknown): SubHabitSuggestion[] {
  if (!Array.isArray(raw)) return [];
  const out: SubHabitSuggestion[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const name = String(r.name ?? "").trim().slice(0, 40);
    const amount = Number(r.targetAmount);
    const unit = String(r.unit ?? "次").trim().slice(0, 12) || "次";
    const iconRaw = String(r.icon ?? "sparkles").trim();
    const icon = VALID_ICONS.has(iconRaw) ? iconRaw : "sparkles";
    if (!name || !Number.isFinite(amount) || amount < 1) continue;
    out.push({ name, targetAmount: Math.round(amount), unit, icon });
    if (out.length >= 6) break;
  }
  return out;
}
