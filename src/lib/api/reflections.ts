// 心得对话 API helper —— 真实后端。
"use client";

import { request } from "@/lib/api/request";

export interface ReflectionMessage {
  id: string;
  entryDate: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

/** 拉取某天的心得对话历史 */
export async function listReflections(date: string): Promise<ReflectionMessage[]> {
  const res = await request(`/api/reflections?date=${encodeURIComponent(date)}`, {
    method: "GET",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { messages?: ReflectionMessage[] };
  return data.messages ?? [];
}

/** 发送一条心得，返回 AI 的回复消息 */
export async function sendReflection(
  date: string,
  content: string,
): Promise<{ userMessage: ReflectionMessage; reply: ReflectionMessage }> {
  const res = await request("/api/reflections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, content }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as {
    userMessage: ReflectionMessage;
    reply: ReflectionMessage;
  };
}
