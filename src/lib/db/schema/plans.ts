import type { InferSelectModel } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  real,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// 用户保存的作息方案。时间点由前端确定性规则计算，此处只持久化输入参数。
export const plans = pgTable(
  "plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    wakeMinutes: integer("wake_minutes").notNull(),
    sleepHours: real("sleep_hours").notNull(),
    workoutWindow: varchar("workout_window", { length: 16 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("plans_user_idx").on(table.userId),
    userCreatedIdx: index("plans_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  }),
);

export type PlanRow = InferSelectModel<typeof plans>;
