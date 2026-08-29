import type { InferSelectModel } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// 用户想养成的习惯定义。
export const habits = pgTable(
  "habits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // 目标量与单位（例如 5 / "个单词"，1 / "分钟"）。
    targetAmount: integer("target_amount").notNull().default(1),
    // 起步量（创建时的初始目标量），用于展示成长轨迹。
    baseAmount: integer("base_amount").notNull().default(1),
    // 上次加量时的连续天数基准，防止重复弹出加量建议。
    lastBumpStreak: integer("last_bump_streak").notNull().default(0),
    unit: varchar("unit", { length: 24 }).notNull().default("次"),
    icon: varchar("icon", { length: 32 }).notNull().default("sparkles"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("habits_user_idx").on(table.userId),
  }),
);

// 每日打卡记录。一天一条（habitId + logDate 唯一）。
export const habitLogs = pgTable(
  "habit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // 打卡对应的自然日（用户本地日期，YYYY-MM-DD）。
    logDate: date("log_date").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    habitDateUnique: unique("habit_logs_habit_date_unique").on(
      table.habitId,
      table.logDate,
    ),
    userIdx: index("habit_logs_user_idx").on(table.userId),
    habitIdx: index("habit_logs_habit_idx").on(table.habitId),
  }),
);

export type Habit = InferSelectModel<typeof habits>;
export type HabitLog = InferSelectModel<typeof habitLogs>;
