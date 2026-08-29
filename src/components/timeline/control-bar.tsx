"use client";

import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { formatTime, type WorkoutWindow } from "@/lib/schedule/engine";

const WINDOWS: WorkoutWindow[] = ["morning", "noon", "evening"];

export function ControlBar({
  wakeMinutes,
  sleepHours,
  workoutWindow,
  onWake,
  onSleep,
  onWorkout,
  onRegenerate,
  generating,
}: {
  wakeMinutes: number;
  sleepHours: number;
  workoutWindow: WorkoutWindow;
  onWake: (m: number) => void;
  onSleep: (h: number) => void;
  onWorkout: (w: WorkoutWindow) => void;
  onRegenerate: () => void;
  generating?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <section
      className="rounded-[28px] border border-[rgba(255,255,255,.72)] bg-[rgba(255,253,248,.82)] p-3 shadow-[var(--cc-shadow-md)] backdrop-blur-xl"
      aria-label={t("app.title")}
      data-el="control-bar"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2.5 text-xs text-muted-foreground">
        <span>
          {t("timeline.summary", {
            wake: formatTime(wakeMinutes),
            sleep: t("timeline.hours", { h: sleepHours }),
          })}
        </span>
        <span className="rounded-full bg-primary/12 px-2 py-0.5 font-semibold text-primary">
          {t("timeline.aiTag")}
        </span>
      </div>

      <div className="grid gap-3">
        {/* 起床时间 */}
        <label className="grid gap-1" data-el="control-wake">
          <span className="text-xs font-semibold text-foreground/80">
            {t("timeline.wakeLabel")}
          </span>
          <input
            type="time"
            value={formatTime(wakeMinutes)}
            onChange={(e) => {
              const [h, m] = e.target.value.split(":").map(Number);
              if (!Number.isNaN(h) && !Number.isNaN(m)) onWake(h * 60 + m);
            }}
            className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-base font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        {/* 睡眠时长 */}
        <label className="grid gap-1.5" data-el="control-sleep">
          <span className="flex items-center justify-between text-xs font-semibold text-foreground/80">
            {t("timeline.sleepLabel")}
            <strong className="tabular-nums text-primary">
              {t("timeline.hours", { h: sleepHours })}
            </strong>
          </span>
          <input
            type="range"
            min={6}
            max={9}
            step={0.5}
            value={sleepHours}
            onChange={(e) => onSleep(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </label>

        {/* 健身偏好 */}
        <div className="grid gap-1.5" data-el="control-workout">
          <span className="text-xs font-semibold text-foreground/80">
            {t("timeline.workoutLabel")}
          </span>
          <div className="flex gap-2" role="group">
            {WINDOWS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onWorkout(w)}
                data-el="workout-chip"
                data-active={workoutWindow === w}
                className={
                  "flex-1 rounded-full px-3 py-2 text-sm font-bold transition active:scale-95 " +
                  (workoutWindow === w
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/12 text-[#7A3F1D]")
                }
              >
                {t(`timeline.workout.${w}`)}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onRegenerate}
          disabled={generating}
          data-el="regenerate-button"
          className="mt-0.5 flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-bold text-background transition active:scale-[.98] disabled:opacity-60"
        >
          <RefreshCw className={"h-4 w-4 " + (generating ? "animate-spin" : "")} />
          {generating ? t("timeline.generating") : t("timeline.regenerate")}
        </button>
      </div>
    </section>
  );
}
