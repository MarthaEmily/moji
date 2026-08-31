import type { InferSelectModel } from "drizzle-orm";
import {
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// 目标类型：决定 AI 拆分逻辑与内置降级模板。
// study 学习 | exam 考证 | weight 减重 | fitness 体能 | skill 技能 | other 其他
export type GoalKind = "study" | "exam" | "weight" | "fitness" | "skill" | "other";

// 带截止日期的大目标（学英语/考雅思/减肥……）。
export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    kind: varchar("kind", { length: 16 }).notNull().default("other"),
    // 用户当下水平的自述（如"零基础"、"雅思模考5.0"、"能连续跑1公里"），
    // 作为 AI 拆分与内置模板起步量的重要上下文，让起点贴合真实水平。
    startLevel: text("start_level").notNull().default(""),
    // 结果型目标的起点/目标数值（如体重 70 -> 62；模考 5.0 -> 6.5）。可空（纯过程型目标）。
    startValue: numeric("start_value"),
    targetValue: numeric("target_value"),
    valueUnit: varchar("value_unit", { length: 24 }),
    // 数值方向：down 越小越好（减重）| up 越大越好（分数）。
    direction: varchar("direction", { length: 8 }).notNull().default("up"),
    startDate: date("start_date").notNull(),
    deadline: date("deadline").notNull(),
    // active 进行中 | done 已完成 | archived 归档
    status: varchar("status", { length: 12 }).notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("goals_user_idx").on(table.userId),
  }),
);

// 目标的阶段（里程碑）。AI 拆分/重拆时整体替换剩余阶段。
export const goalStages = pgTable(
  "goal_stages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull(),
    name: text("name").notNull(),
    // 本阶段重点/说明。
    focus: text("focus").notNull().default(""),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    // 本阶段每天要练的量与单位（过程信号，如每天背 20 个）。
    dailyTarget: integer("daily_target").notNull().default(1),
    dailyUnit: varchar("daily_unit", { length: 24 }).notNull().default("次"),
    // 本阶段末期望到达的结果数值（可空）。
    milestoneValue: numeric("milestone_value"),
    icon: varchar("icon", { length: 32 }).notNull().default("sparkles"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    goalIdx: index("goal_stages_goal_idx").on(table.goalId),
    userIdx: index("goal_stages_user_idx").on(table.userId),
    goalOrderUnique: unique("goal_stages_goal_order_unique").on(
      table.goalId,
      table.orderIndex,
    ),
  }),
);

// 阶段每日打卡（过程信号）。一天一条（stageId + logDate 唯一）。
export const goalStageLogs = pgTable(
  "goal_stage_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stageId: uuid("stage_id")
      .notNull()
      .references(() => goalStages.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: date("log_date").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    stageDateUnique: unique("goal_stage_logs_stage_date_unique").on(
      table.stageId,
      table.logDate,
    ),
    goalIdx: index("goal_stage_logs_goal_idx").on(table.goalId),
    userIdx: index("goal_stage_logs_user_idx").on(table.userId),
  }),
);

// 阶段内的每日子任务（2-4 个），每个可单独打卡。
export const goalStageTasks = pgTable(
  "goal_stage_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stageId: uuid("stage_id")
      .notNull()
      .references(() => goalStages.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull(),
    name: text("name").notNull(),
    dailyTarget: integer("daily_target").notNull().default(1),
    dailyUnit: varchar("daily_unit", { length: 24 }).notNull().default("次"),
    icon: varchar("icon", { length: 32 }).notNull().default("sparkles"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    stageIdx: index("goal_stage_tasks_stage_idx").on(table.stageId),
    userIdx: index("goal_stage_tasks_user_idx").on(table.userId),
    stageOrderUnique: unique("goal_stage_tasks_stage_order_unique").on(
      table.stageId,
      table.orderIndex,
    ),
  }),
);

// 子任务每日打卡（taskId + logDate 唯一），过程信号的最细粒度。
export const goalTaskLogs = pgTable(
  "goal_task_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => goalStageTasks.id, { onDelete: "cascade" }),
    stageId: uuid("stage_id")
      .notNull()
      .references(() => goalStages.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: date("log_date").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    taskDateUnique: unique("goal_task_logs_task_date_unique").on(
      table.taskId,
      table.logDate,
    ),
    stageIdx: index("goal_task_logs_stage_idx").on(table.stageId),
    userIdx: index("goal_task_logs_user_idx").on(table.userId),
  }),
);

// 手动记录的当前数值（结果信号，如今天体重 68kg / 模考 5.5）。
export const goalMeasurements = pgTable(
  "goal_measurements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    measuredOn: date("measured_on").notNull(),
    value: numeric("value").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    goalDateUnique: unique("goal_measurements_goal_date_unique").on(
      table.goalId,
      table.measuredOn,
    ),
    goalIdx: index("goal_measurements_goal_idx").on(table.goalId),
    userIdx: index("goal_measurements_user_idx").on(table.userId),
  }),
);

export type Goal = InferSelectModel<typeof goals>;
export type GoalStage = InferSelectModel<typeof goalStages>;
export type GoalStageLog = InferSelectModel<typeof goalStageLogs>;
export type GoalStageTask = InferSelectModel<typeof goalStageTasks>;
export type GoalTaskLog = InferSelectModel<typeof goalTaskLogs>;
export type GoalMeasurement = InferSelectModel<typeof goalMeasurements>;
