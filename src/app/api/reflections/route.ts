import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { upsertUser } from "@/lib/db/queries";
import {
  listReflectionsForDate,
  addReflection,
} from "@/lib/db/queries/reflections";
import { listHabitsWithLogs } from "@/lib/db/queries/habits";
import { buildHabitContext } from "@/lib/habits/context";
import { appAi, AppAIUnavailableError } from "@/lib/eazo-ai-billing";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 心得陪伴 AI 的人格。核心：去羞耻、成长型、把「没做到」归因到可调整的外部因素，
// 绝不允许把结果上升到人格否定。
const SYSTEM = `你是一位温暖、真诚的习惯陪伴者，不是说教的教练。用户会写下今天的感受、困难或没做到的事，你要认真倾听并回应。

你必须坚持的信念（用你自己的话自然表达，不要生硬罗列）：
- 习惯的本质只是「做这件事对你而言变成了阻力最小的选择」。没有"21天/三个月/六个月就能养成习惯"这种说法，最新研究并不支持固定天数。
- 一个坚持很久的习惯停下来，是完全正常的事，习惯本来就会有起伏，这不代表失败。
- 没做到，往往和外部可调整的生活因素有关：通勤距离、当天可用时间、营养与睡眠、身体与心理状态、家庭与人际、居住与工作环境、手头的工具是否顺手等。帮用户把注意力引到这些具体、可改变的因素上。

你绝对不能做的事：
- 绝不认同或强化用户的人格否定（如"我真蠢""我就是没毅力""我太差了"）。当用户这样说时，温柔而明确地帮他把"我是个怎样的人"的评判，换成"今天发生了什么、什么因素在影响我"。
- 不空喊"加油、你可以的"，不灌鸡汤，不居高临下。
- 不逼用户立刻改进；有时只需要被理解，允许他就停在原地。

风格：像一个懂得多、又很稳的朋友。中文，口语、简短（一般 2-5 句），可以适当反问一个具体的小问题帮他看清处境。不要用列表符号，像聊天一样自然说话。`;

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ ok: false, error: "invalid_date" }, { status: 400 });
  }
  const messages = await listReflectionsForDate(auth.user.id, date);
  return NextResponse.json({ ok: true, messages });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const date = String(body?.date ?? "");
  const content = String(body?.content ?? "").trim();
  if (!DATE_RE.test(date) || !content || content.length > 2000) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  await upsertUser({
    id: auth.user.id,
    email: auth.user.email,
    name: auth.user.name,
    avatarUrl: auth.user.avatarUrl,
  });

  // 存用户消息。
  const userMsg = await addReflection({
    userId: auth.user.id,
    entryDate: date,
    role: "user",
    content,
  });

  // 组装上下文：打卡摘要 + 当天已有对话历史。
  const [habits, history] = await Promise.all([
    listHabitsWithLogs(auth.user.id),
    listReflectionsForDate(auth.user.id, date),
  ]);
  const context = buildHabitContext(habits, date);

  const chatHistory = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  let reply: string;
  try {
    const completion = await appAi.chat({
      messages: [
        { role: "system", content: SYSTEM },
        { role: "system", content: `[用户打卡情况，仅供你参考，不要机械复述]\n${context}` },
        ...chatHistory,
      ],
      temperature: 0.8,
    });
    reply = completion.choices?.[0]?.message?.content?.trim() || FALLBACK;
  } catch (error) {
    if (!(error instanceof AppAIUnavailableError)) {
      console.error("[reflections] error", error);
    }
    reply = FALLBACK;
  }

  const assistantMsg = await addReflection({
    userId: auth.user.id,
    entryDate: date,
    role: "assistant",
    content: reply,
  });

  return NextResponse.json({ ok: true, userMessage: userMsg, reply: assistantMsg });
}

const FALLBACK =
  "谢谢你愿意写下来。没做到不代表你这个人有问题，更多时候是今天的时间、精力或环境刚好不允许。要不要跟我说说，今天是什么具体的事在挤占你？我们一起看看，而不是怪自己。";
