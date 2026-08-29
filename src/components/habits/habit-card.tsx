"use client";

import { useTranslation } from "react-i18next";
import { Flame, Check, Trash2, TrendingUp } from "lucide-react";
import { HabitIcon } from "./habit-icon";
import type { HabitWithLogs } from "@/lib/api/habits";
import { computeStreak, isCheckedToday } from "@/lib/habits/streak";
import { evaluateBump } from "@/lib/habits/growth";

export function HabitCard({
  habit,
  busy,
  onToggle,
  onDelete,
  onBump,
  onEase,
}: {
  habit: HabitWithLogs;
  busy: boolean;
  onToggle: (checked: boolean) => void;
  onDelete: () => void;
  onBump: (to: number, streak: number) => void;
  onEase: () => void;
}) {
  const { t } = useTranslation();
  const done = isCheckedToday(habit.logDates);
  const streak = computeStreak(habit.logDates);
  const bump = evaluateBump({
    logDates: habit.logDates,
    targetAmount: habit.targetAmount,
    lastBumpStreak: habit.lastBumpStreak,
  });

  return (
    <div
      className="rounded-[24px] border border-[rgba(255,255,255,.72)] bg-[rgba(255,253,248,.82)] p-4 shadow-[var(--cc-shadow-sm)] backdrop-blur-xl"
      data-el="habit-card"
    >
      <div className="flex items-center gap-3">
        <span
          className={
            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl " +
            (done ? "bg-primary text-primary-foreground" : "bg-primary/12 text-primary")
          }
        >
          <HabitIcon name={habit.icon} className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold text-foreground">{habit.name}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("habits.target", { amount: habit.targetAmount, unit: habit.unit })}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-full bg-secondary/30 px-2.5 py-1 text-xs font-bold text-[#7A3F1D]">
          <Flame className="h-3.5 w-3.5" />
          {streak > 0 ? t("habits.streak", { days: streak }) : t("habits.streakZero")}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onToggle(!done)}
          data-el="habit-checkin"
          data-done={done}
          className={
            "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition active:scale-[.98] disabled:opacity-60 " +
            (done ? "bg-primary/12 text-primary" : "bg-foreground text-background")
          }
        >
          <Check className="h-4 w-4" />
          {done ? t("habits.todayDone") : t("habits.checkIn")}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          data-el="habit-delete"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-white/50 text-muted-foreground transition active:scale-95 disabled:opacity-50"
          aria-label={t("common.delete")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {bump.suggest && (
        <div
          className="mt-3 rounded-2xl border border-secondary/60 bg-secondary/20 p-3"
          data-el="habit-growth-banner"
        >
          <div className="flex items-start gap-2">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#7A3F1D]">
                {t("habits.bumpTitle", { days: bump.streak })}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("habits.bumpSuggest", { amount: bump.to, unit: habit.unit })}
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onBump(bump.to, bump.streak)}
              data-el="habit-bump-accept"
              className="flex-1 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition active:scale-95 disabled:opacity-60"
            >
              {t("habits.bumpAccept")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onEase}
              data-el="habit-bump-toohard"
              className="rounded-full border border-border bg-white/50 px-3 py-2 text-xs font-semibold text-muted-foreground transition active:scale-95 disabled:opacity-60"
            >
              {t("habits.bumpTooHard")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
