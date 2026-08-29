import type { InferSelectModel } from "drizzle-orm";
import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// 「今日心得」AI 陪伴对话。按天保存，一天多条（user/assistant 交替）。
export const reflections = pgTable(
  "reflections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // 心得对应的自然日（用户本地日期 YYYY-MM-DD）。
    entryDate: date("entry_date").notNull(),
    // 消息角色：'user' 用户所写；'assistant' AI 陪伴回复。
    role: varchar("role", { length: 16 }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userDateIdx: index("reflections_user_date_idx").on(
      table.userId,
      table.entryDate,
    ),
  }),
);

export type Reflection = InferSelectModel<typeof reflections>;
