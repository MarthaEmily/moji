import { type NextRequest, NextResponse } from "next/server";
import { notifications, EazoNotificationPublishError } from "@eazo/sdk/server";

// 每小时提醒 cron（由 vercel.json#crons 调度，CRON_SECRET 鉴权）。
// 仅在活跃时段（默认 9:00–21:00）广播一条温和的「未完成小习惯」提醒，
// 深夜时段直接跳过，避免打扰。推送 v1 只支持广播给全体订阅者，
// 精准的“谁还没打卡”由 App 内提醒条 + 红点承担。
const ACTIVE_START = 9;
const ACTIVE_END = 21; // 含 21 点，22 点起休息
const TZ_OFFSET_HOURS = 8; // Asia/Shanghai，与 App 的本地日计算一致

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 计算目标时区当前小时（cron 环境为 UTC）。
  const hour = (new Date().getUTCHours() + TZ_OFFSET_HOURS) % 24;
  if (hour < ACTIVE_START || hour > ACTIVE_END) {
    return NextResponse.json({ skipped: true, reason: "quiet_hours", hour });
  }

  const { title, body } = pickMessage(hour);

  try {
    const result = await notifications.publish({
      title,
      body,
      data: { source: "cron-hourly-reminder", hour },
    });
    return NextResponse.json({ ...result, hour });
  } catch (err) {
    if (err instanceof EazoNotificationPublishError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.code >= 400 && err.code < 600 ? err.code : 500 },
      );
    }
    console.error("[notifications/cron/hourly] unexpected error", err);
    return NextResponse.json({ error: "publish failed" }, { status: 500 });
  }
}

// 按时段挑选贴合场景的文案（早/日间/傍晚/临睡）。
function pickMessage(hour: number): { title: string; body: string } {
  if (hour <= 10) {
    return { title: "早上好，先完成一件小事 ☀️", body: "打开看看今天的小习惯，先打卡最容易的一个吧。" };
  }
  if (hour <= 14) {
    return { title: "别忘了今天的小习惯 🌿", body: "还有没打卡的习惯吗？花一分钟顺手完成它。" };
  }
  if (hour <= 18) {
    return { title: "傍晚了，进度如何？⏳", body: "趁还有精力，把今天剩下的小习惯补上吧。" };
  }
  return { title: "睡前收个尾 🌙", body: "看看今天还有哪些小习惯没完成，别让连续天数断掉。" };
}
