// 阶段目标的 AI 拆分提示词、结果清洗，以及按目标类型的内置科学降级模板。
// 有 AI 用 AI（DeepSeek-V3.1），不可用则用这里的确定性模板，保证功能始终可用。

import type { GoalKind, GoalPlanInput, StagePlan } from "./types";

const ICONS = [
  "book",
  "dumbbell",
  "water",
  "steps",
  "brain",
  "pen",
  "moon",
  "language",
  "apple",
  "sparkles",
];

const KIND_HINT: Record<GoalKind, string> = {
  study: "学习类：先打基础再进阶，循序渐进增加每日练习量；后段侧重综合运用与复习。",
  exam: "考证类：按考纲模块分阶段攻克，前期铺基础、中期强化题型、后期全真模拟与查漏补缺。",
  weight:
    "减重类：务必健康安全，每周减重不超过体重的 0.5%-1%；靠饮食+运动的每日小习惯推进，绝不极端节食。",
  fitness: "体能类：遵循渐进超负荷，循序渐进增加训练量/强度，安排恢复，避免受伤。",
  skill: "技能类：拆成可练习的子技能，由易到难，每阶段聚焦一项并保证足量刻意练习。",
  other: "通用：把目标沿时间线拆成由浅入深的阶段，每阶段给出极易坚持的每日小习惯。",
};

export const GOAL_PLAN_SYSTEM = `你是一位科学的目标规划教练，服务于「莫急」——一个主张"从最小一步开始、不制造焦虑"的习惯 App。
用户给你一个带截止日期的目标，你要把从现在到截止日的时间，拆成 3-6 个循序渐进的阶段（里程碑）。
关键：每个阶段不要只给一个笼统任务，而要拆成 2-4 个**具体、可每天单独打卡**的小任务（例如"打基础"阶段=每天背20个单词+听1段听力+读1篇短文）。
核心原则：
1. 每个子任务起步量要小、极易完成，随阶段推进温和加量。
2. 阶段与子任务要科学、符合该目标类型的规律（见类型提示）。减重类必须健康安全，严禁极端方案。
3. 用鼓励、去羞耻的语气写 focus 文案，不要制造压力。
每个阶段字段：
- name：阶段名（≤12字中文）
- focus：本阶段重点，一句话（≤40字）
- weight：该阶段时间占比权重（正数，之和不要求为1，规划器会归一化）
- tasks：数组，2-4 个每日子任务，每个含 { name（≤12字）, dailyTarget（正整数）, dailyUnit（如"个/分钟/篇/组"）, icon（从图标集选） }
- milestoneValue：若目标是可量化数值（体重/分数），给本阶段末期望到达的数值（number）；否则填 null
- icon：阶段图标，从 [${ICONS.join(", ")}] 里选最贴切的一个
只返回 JSON：{"stages":[{"name":"...","focus":"...","weight":1,"tasks":[{"name":"背单词","dailyTarget":20,"dailyUnit":"个","icon":"language"}],"milestoneValue":null,"icon":"book"}]}，不要任何多余文字。`;

export function buildPlanUserPrompt(input: GoalPlanInput): string {
  const parts = [
    `目标：${input.title}`,
    `目标类型：${input.kind}（${KIND_HINT[input.kind]}）`,
    `距截止还有：${input.daysRemaining} 天`,
  ];
  if (input.startLevel) {
    parts.push(
      `用户当前水平：${input.startLevel}（务必据此设定起点——零基础/初学者起步量要更小更缓，有基础/进阶者可适当拔高起点与阶段目标，让方案贴合真实水平）`,
    );
  }
  if (input.startValue != null && input.targetValue != null) {
    parts.push(
      `数值：从 ${input.startValue} 到 ${input.targetValue} ${input.valueUnit ?? ""}（方向：${
        input.direction === "down" ? "越小越好" : "越大越好"
      }）`,
    );
  }
  return parts.join("\n");
}

interface RawTask {
  name?: unknown;
  dailyTarget?: unknown;
  dailyUnit?: unknown;
  icon?: unknown;
}

interface RawStage {
  name?: unknown;
  focus?: unknown;
  weight?: unknown;
  tasks?: unknown;
  dailyTarget?: unknown;
  dailyUnit?: unknown;
  milestoneValue?: unknown;
  icon?: unknown;
}

function sanitizeTasks(raw: unknown, fallbackIcon: string): StagePlan["tasks"] {
  const out: StagePlan["tasks"] = [];
  if (Array.isArray(raw)) {
    for (const it of raw as RawTask[]) {
      const name = String(it?.name ?? "").trim().slice(0, 16);
      if (!name) continue;
      out.push({
        name,
        dailyTarget: Math.max(1, Math.round(Number(it?.dailyTarget) || 1)),
        dailyUnit: String(it?.dailyUnit ?? "次").trim().slice(0, 12) || "次",
        icon: ICONS.includes(String(it?.icon)) ? String(it?.icon) : fallbackIcon,
      });
      if (out.length >= 4) break;
    }
  }
  return out;
}

/** 清洗 AI 输出为合法 StagePlan[]，非法项丢弃；空则返回 []。 */
export function sanitizeStages(raw: unknown): StagePlan[] {
  if (!Array.isArray(raw)) return [];
  const out: StagePlan[] = [];
  for (const item of raw as RawStage[]) {
    const name = String(item?.name ?? "").trim().slice(0, 20);
    if (!name) continue;
    const weight = Math.max(0.1, Number(item?.weight) || 1);
    const mv = Number(item?.milestoneValue);
    const icon = ICONS.includes(String(item?.icon)) ? String(item?.icon) : "sparkles";
    let tasks = sanitizeTasks(item?.tasks, icon);
    // 兼容旧式 dailyTarget/dailyUnit：无 tasks 时退化为单条子任务。
    if (tasks.length === 0 && item?.dailyTarget != null) {
      tasks = [
        {
          name,
          dailyTarget: Math.max(1, Math.round(Number(item?.dailyTarget) || 1)),
          dailyUnit: String(item?.dailyUnit ?? "次").trim().slice(0, 12) || "次",
          icon,
        },
      ];
    }
    if (tasks.length === 0) continue; // 阶段必须至少 1 个子任务
    out.push({
      name,
      focus: String(item?.focus ?? "").trim().slice(0, 60),
      weight,
      tasks,
      milestoneValue: Number.isFinite(mv) ? mv : null,
      icon,
    });
    if (out.length >= 6) break;
  }
  return out;
}

// ---- 内置科学降级模板 ----

const KIND_ICON: Record<GoalKind, string> = {
  study: "book",
  exam: "pen",
  weight: "apple",
  fitness: "dumbbell",
  skill: "brain",
  other: "sparkles",
};

const KIND_TASKS: Record<
  GoalKind,
  { name: string; ratio: number; unit: string; icon: string }[]
> = {
  study: [
    { name: "背单词", ratio: 1, unit: "个", icon: "language" },
    { name: "听力练习", ratio: 0.5, unit: "分钟", icon: "brain" },
    { name: "阅读短文", ratio: 0.1, unit: "篇", icon: "book" },
  ],
  exam: [
    { name: "刷真题", ratio: 1, unit: "题", icon: "pen" },
    { name: "整理错题", ratio: 0.3, unit: "题", icon: "book" },
    { name: "看知识点", ratio: 0.5, unit: "分钟", icon: "brain" },
  ],
  weight: [
    { name: "有氧运动", ratio: 1, unit: "分钟", icon: "steps" },
    { name: "喝水", ratio: 8, unit: "杯", icon: "water" },
    { name: "记录饮食", ratio: 1, unit: "次", icon: "apple" },
  ],
  fitness: [
    { name: "力量训练", ratio: 1, unit: "组", icon: "dumbbell" },
    { name: "拉伸放松", ratio: 5, unit: "分钟", icon: "sparkles" },
  ],
  skill: [
    { name: "刻意练习", ratio: 1, unit: "分钟", icon: "brain" },
    { name: "复盘总结", ratio: 0.2, unit: "分钟", icon: "pen" },
  ],
  other: [
    { name: "推进一步", ratio: 1, unit: "次", icon: "sparkles" },
    { name: "记录进展", ratio: 1, unit: "次", icon: "pen" },
  ],
};

/**
 * 按目标类型生成 3-4 个循序渐进阶段，每个阶段含 2-4 个每日子任务。
 * 若为可量化数值目标，会把 startValue→targetValue 线性分配到各阶段末（减重按安全速率天然满足）。
 */
export function fallbackPlan(input: GoalPlanInput): StagePlan[] {
  const icon = KIND_ICON[input.kind];

  // 三阶段：入门 / 强化 / 冲刺，每日量温和递增。
  const templates: { name: string; focus: string; mult: number }[] =
    input.kind === "weight"
      ? [
          { name: "启动期", focus: "先动起来，养成每天一点点的习惯，别急。", mult: 1 },
          { name: "稳步期", focus: "把每日活动量稳稳提上去，健康减、不反弹。", mult: 1.5 },
          { name: "巩固期", focus: "保持节奏冲向目标，允许波动，慢慢来。", mult: 2 },
        ]
      : input.kind === "exam"
        ? [
            { name: "打基础", focus: "过一遍考纲基础，量小易坚持。", mult: 1 },
            { name: "强化题型", focus: "分模块刷题，熟悉套路。", mult: 1.6 },
            { name: "全真模拟", focus: "模考+查漏补缺，稳住心态。", mult: 2.2 },
          ]
        : [
            { name: "入门期", focus: "从最小一步开始，先建立每天做的习惯。", mult: 1 },
            { name: "进阶期", focus: "循序渐进加量，稳稳往前走。", mult: 1.6 },
            { name: "精进期", focus: "综合运用与复习，冲向目标。", mult: 2.2 },
          ];

  const base = baseDaily(input.kind, input.daysRemaining);
  const levelFactor = levelMultiplier(input.startLevel);
  const taskTpls = KIND_TASKS[input.kind];
  const n = templates.length;

  return templates.map((tpl, i) => {
    let milestoneValue: number | null = null;
    if (input.startValue != null && input.targetValue != null) {
      const frac = (i + 1) / n;
      milestoneValue =
        input.startValue + (input.targetValue - input.startValue) * frac;
      milestoneValue = Math.round(milestoneValue * 10) / 10;
    }
    const tasks = taskTpls.map((tt) => ({
      name: tt.name,
      dailyTarget: Math.max(1, Math.round(base * tpl.mult * levelFactor * tt.ratio)),
      dailyUnit: tt.unit,
      icon: tt.icon,
    }));
    return {
      name: tpl.name,
      focus: tpl.focus,
      weight: 1,
      tasks,
      milestoneValue,
      icon,
    };
  });
}

// 从"当前水平"自述里粗略解析起步系数：零基础更缓，有基础更高。
function levelMultiplier(level: string): number {
  const s = (level || "").toLowerCase();
  if (!s.trim()) return 1;
  const beginner = ["零基础", "从零", "没基础", "小白", "初学", "新手", "入门", "beginner", "none", "starting"];
  const advanced = ["有基础", "进阶", "熟练", "较好", "不错", "中级", "高级", "老手", "advanced", "intermediate", "proficient"];
  if (beginner.some((k) => s.includes(k))) return 0.7;
  if (advanced.some((k) => s.includes(k))) return 1.4;
  return 1;
}

function baseDaily(kind: GoalKind, days: number): number {
  const tight = days < 45;
  switch (kind) {
    case "study":
      return tight ? 20 : 10; // 分钟
    case "exam":
      return tight ? 15 : 8; // 题
    case "weight":
      return tight ? 25 : 15; // 分钟活动
    case "fitness":
      return tight ? 3 : 2; // 组
    case "skill":
      return tight ? 20 : 12; // 分钟
    default:
      return 1;
  }
}
