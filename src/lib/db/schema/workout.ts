import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// 每日「健身」时间块状态。一天一条（userId + day 唯一）。
// 核心理念：不催打卡。到点未完成时，健身块自动 +20min 顺延，最晚不超过 24:00。
export const workoutDays = pgTable(
  "workout_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // 对应的自然日（用户本地日期，YYYY-MM-DD）。
    day: date("day").notNull(),
    // 首次创建当天时由作息引擎算出的健身「起始」分钟数（0-1439）。
    baseMinutes: integer("base_minutes").notNull(),
    // 经过若干次 +20min 顺延后的当前目标分钟数（0-1440，1440 表示 24:00 封顶）。
    shiftedMinutes: integer("shifted_minutes").notNull(),
    // 今日是否已完成健身。
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userDayUnique: unique("workout_days_user_day_unique").on(
      table.userId,
      table.day,
    ),
    userIdx: index("workout_days_user_idx").on(table.userId),
  }),
);

export type WorkoutDay = InferSelectModel<typeof workoutDays>;
