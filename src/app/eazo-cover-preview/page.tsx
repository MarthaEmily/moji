"use client";

import { useEffect, useState } from "react";
import { EazoCoverReady } from "@/components/eazo-cover/ready";
import { computeSchedule, formatTime, type NodeKey } from "@/lib/schedule/engine";

// 隐私安全的确定性演示数据：起床 07:00，睡眠时长在 7↔8.5 之间循环变化，
// 时间轴节点随之自动重算，展示「输入即推理」的核心价值。3-5 秒自主循环。
const COVER_PREVIEW_DATA = {
  wakeMinutes: 7 * 60,
  workoutWindow: "evening" as const,
  sleepSteps: [8, 8.5, 7.5, 7, 7.5, 8],
};

const NODE_LABELS: Record<NodeKey, string> = {
  wake: "起床",
  breakfast: "早餐",
  lunch: "午餐",
  workout: "健身",
  dinner: "晚餐",
  bedtime: "上床",
};

export default function CoverPreview() {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIdx((i) => (i + 1) % COVER_PREVIEW_DATA.sleepSteps.length);
    }, 900);
    return () => clearInterval(timer);
  }, []);

  const sleepHours = COVER_PREVIEW_DATA.sleepSteps[stepIdx];
  const result = computeSchedule({
    wakeMinutes: COVER_PREVIEW_DATA.wakeMinutes,
    sleepHours,
    workoutWindow: COVER_PREVIEW_DATA.workoutWindow,
  });

  return (
    <EazoCoverReady>
      <div
        className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden bg-background px-6"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-[10%] h-56 w-56 -translate-x-1/2 rounded-full blur-[34px]"
          style={{ background: "rgba(255,209,102,.5)" }}
        />
        <div
          className="pointer-events-none absolute -right-16 bottom-[8%] h-64 w-56 rounded-full blur-[34px]"
          style={{ background: "rgba(232,128,64,.3)" }}
        />

        <div className="relative">
          <div className="mb-5 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="莫急"
              width={56}
              height={56}
              className="h-14 w-14 rounded-[18px] object-cover shadow-[0_10px_28px_rgba(232,128,64,0.28)]"
            />
            <div>
              <div className="text-2xl font-bold leading-none tracking-tight text-foreground">
                莫急
              </div>
              <div className="mt-1 text-xs font-semibold text-muted-foreground">
                从最小的一步开始
              </div>
            </div>
          </div>
          <h1 className="mt-1 mb-5 text-3xl font-bold tracking-tight text-foreground">
            睡 {sleepHours} 小时的一天
          </h1>

          <div className="relative">
            <div
              className="absolute left-[38px] top-3 bottom-3 w-[3px] rounded-full"
              style={{
                background: "linear-gradient(#FFD166,#E88040 55%,#6F5142)",
                boxShadow: "0 0 24px rgba(232,128,64,.4)",
              }}
            />
            <div className="flex flex-col gap-1.5">
              {result.nodes.map((n) => {
                const hot = n.key === "workout";
                return (
                  <div
                    key={n.key}
                    className="grid grid-cols-[80px_1fr] items-center"
                  >
                    <div
                      className="z-[1] grid h-10 w-16 place-items-center rounded-[20px] text-base font-bold tabular-nums transition-all duration-500"
                      style={
                        hot
                          ? { background: "linear-gradient(135deg,#fff8e7,#FFD166)", color: "#6C3B15" }
                          : { background: "rgba(255,250,242,.85)", color: "#E88040" }
                      }
                    >
                      {formatTime(n.minutes)}
                    </div>
                    <div className="pl-2 text-sm font-semibold text-foreground">
                      {NODE_LABELS[n.key]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </EazoCoverReady>
  );
}
