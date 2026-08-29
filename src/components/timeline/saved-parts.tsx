"use client";

import { useTranslation } from "react-i18next";
import { Bookmark, Trash2, CalendarClock, LogIn } from "lucide-react";
import { auth } from "@eazo/sdk";
import { formatTime, WORKOUT_LABELS } from "@/lib/schedule/engine";
import type { SavedPlan } from "@/lib/api";

export function PlanCard({
  plan,
  locale,
  deleting,
  onLoad,
  onDelete,
}: {
  plan: SavedPlan;
  locale: string;
  deleting: boolean;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const date = new Date(plan.createdAt).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
  return (
    <div
      className="rounded-[24px] border border-[rgba(255,255,255,.72)] bg-[rgba(255,253,248,.82)] p-4 shadow-[var(--cc-shadow-sm)] backdrop-blur-xl"
      data-el="saved-plan-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/12 text-primary">
              <CalendarClock className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              {formatTime(plan.wakeMinutes)}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("saved.meta", {
              wake: formatTime(plan.wakeMinutes),
              sleep: plan.sleepHours,
              workout: t(`timeline.workout.${plan.workoutWindow}`),
            })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {t("saved.savedAt", { date })}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {WORKOUT_LABELS[plan.workoutWindow]}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onLoad}
          data-el="plan-load"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition active:scale-[.98]"
        >
          <Bookmark className="h-4 w-4" />
          {t("saved.load")}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          data-el="plan-delete"
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white/50 text-muted-foreground transition active:scale-95 disabled:opacity-50"
          aria-label={t("saved.delete")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function SignInPrompt() {
  const { t } = useTranslation();
  return (
    <div
      className="mt-4 flex flex-col items-center gap-4 rounded-[24px] border border-[rgba(255,255,255,.72)] bg-[rgba(255,253,248,.82)] px-6 py-10 text-center shadow-[var(--cc-shadow-sm)] backdrop-blur-xl"
      data-el="signin-prompt"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/12 text-primary">
        <LogIn className="h-6 w-6" />
      </span>
      <p className="text-sm text-muted-foreground">{t("saved.signInPrompt")}</p>
      <button
        type="button"
        onClick={() => auth.login().catch(() => undefined)}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition active:scale-95"
      >
        {t("saved.signInCta")}
      </button>
    </div>
  );
}

export function EmptyState({ onGo }: { onGo: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      className="mt-4 flex flex-col items-center gap-4 rounded-[24px] border border-dashed border-border bg-white/30 px-6 py-10 text-center"
      data-el="saved-empty"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
        <Bookmark className="h-6 w-6" />
      </span>
      <p className="text-sm text-muted-foreground">{t("saved.empty")}</p>
      <button
        type="button"
        onClick={onGo}
        className="rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background transition active:scale-95"
      >
        {t("saved.goTimeline")}
      </button>
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="mt-2 flex flex-col gap-3" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="h-[132px] animate-pulse rounded-[24px] bg-white/40" />
      ))}
    </div>
  );
}
