"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertTriangle, Bookmark, Check, FolderOpen } from "lucide-react";
import { auth } from "@eazo/sdk";
import { useEazo } from "@eazo/sdk/react";
import { WarmAura } from "@/components/timeline/warm-aura";
import { TimelineStage, type StageNode } from "@/components/timeline/timeline-stage";
import { ControlBar } from "@/components/timeline/control-bar";
import { TabBar } from "@/components/timeline/tab-bar";
import { MyPlansSheet, type LoadedPlan } from "@/components/timeline/my-plans-sheet";
import { computeSchedule, type WorkoutWindow } from "@/lib/schedule/engine";
import { FALLBACK_RATIONALE } from "@/lib/schedule/rationale";
import { generateRationales, savePlan } from "@/lib/api";
import { useWorkoutDay } from "@/lib/habits/use-workout-day";
import { DEFAULT_PLAN_INPUT } from "@/stores/plan-store";

export function TimelineScreen() {
  const { t } = useTranslation();
  const user = useEazo((s) => s.auth.user);

  const [wakeMinutes, setWakeMinutes] = useState(DEFAULT_PLAN_INPUT.wakeMinutes);
  const [sleepHours, setSleepHours] = useState(DEFAULT_PLAN_INPUT.sleepHours);
  const [workoutWindow, setWorkoutWindow] = useState<WorkoutWindow>(
    DEFAULT_PLAN_INPUT.workoutWindow,
  );
  const [rationales, setRationales] = useState<Partial<Record<string, string>>>({});
  const [loadingRationale, setLoadingRationale] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);

  const handleLoadPlan = useCallback((p: LoadedPlan) => {
    setWakeMinutes(p.wakeMinutes);
    setSleepHours(p.sleepHours);
    setWorkoutWindow(p.workoutWindow);
    setJustSaved(false);
  }, []);

  const result = useMemo(
    () => computeSchedule({ wakeMinutes, sleepHours, workoutWindow }),
    [wakeMinutes, sleepHours, workoutWindow],
  );

  // 作息引擎算出的原定健身「起始」分钟（同日 0-1439）。
  const baseWorkoutMinutes = useMemo(() => {
    const w = result.nodes.find((n) => n.key === "workout");
    return (((Math.round(w?.minutes ?? 0) % 1440) + 1440) % 1440);
  }, [result]);

  // 健身实时后移 + 完成状态（登录后持久化到数据库）。
  const workout = useWorkoutDay(baseWorkoutMinutes);

  const refreshRationales = useCallback(async () => {
    setLoadingRationale(true);
    setJustSaved(false);
    try {
      const map = await generateRationales({ result });
      setRationales(map);
    } catch {
      setRationales({ ...FALLBACK_RATIONALE });
    } finally {
      setLoadingRationale(false);
    }
  }, [result]);

  useEffect(() => {
    const id = setTimeout(() => void refreshRationales(), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakeMinutes, sleepHours, workoutWindow]);

  const nodes: StageNode[] = result.nodes.map((n) => ({
    ...n,
    // 健身节点使用实时后移后的目标时间（登录时来自数据库）。
    minutes: n.key === "workout" && workout.loggedIn ? workout.minutes : n.minutes,
    rationale: rationales[n.key] ?? "",
  }));

  const handleSave = async () => {
    if (!user) {
      auth.login().catch(() => undefined);
      return;
    }
    setSaving(true);
    try {
      await savePlan({ wakeMinutes, sleepHours, workoutWindow });
      toast.success(t("toast.saveSuccess"));
      setJustSaved(true);
    } catch {
      toast.error(t("toast.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-full justify-center">
      <WarmAura />
      <main
        className="flex w-full max-w-[460px] flex-col gap-3.5 px-[18px]"
        style={{
          paddingTop: "max(56px, env(safe-area-inset-top, 0px))",
          paddingBottom:
            "calc(80px + max(34px, env(safe-area-inset-bottom, 0px)))",
        }}
      >
        <header className="flex items-start justify-between gap-3.5" data-el="app-header">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {t("app.eyebrow")}
            </div>
            <h1 className="mt-1 text-[34px] font-bold leading-[1.08] tracking-tight">
              {t("app.title")}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setPlansOpen(true)}
              data-el="my-plans-button"
              className="flex items-center gap-1.5 rounded-full border border-border bg-white/50 px-3 py-2 text-xs font-semibold text-muted-foreground shadow-[var(--cc-shadow-sm)] backdrop-blur-md transition active:scale-95"
            >
              <FolderOpen className="h-4 w-4" />
              {t("timeline.myPlans")}
            </button>
            <SaveButton
              saving={saving}
              justSaved={justSaved}
              loggedIn={!!user}
              onSave={handleSave}
            />
          </div>
        </header>

        {result.conflict && (
          <div
            className="flex items-start gap-2 rounded-2xl border border-secondary/60 bg-secondary/25 px-3 py-2 text-xs text-[#7A3F1D]"
            data-el="conflict-banner"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{result.conflict}</span>
          </div>
        )}

        <TimelineStage
          nodes={nodes}
          rationaleLoading={loadingRationale}
          workout={
            workout.loggedIn
              ? {
                  completed: workout.completed,
                  capped: workout.capped,
                  shifted: workout.shifted,
                  loggedIn: workout.loggedIn,
                  onToggle: workout.toggleComplete,
                }
              : undefined
          }
        />

        <ControlBar
          wakeMinutes={wakeMinutes}
          sleepHours={sleepHours}
          workoutWindow={workoutWindow}
          onWake={setWakeMinutes}
          onSleep={setSleepHours}
          onWorkout={setWorkoutWindow}
          onRegenerate={refreshRationales}
          generating={loadingRationale}
        />

        {!user && (
          <p className="px-1 text-center text-xs text-muted-foreground">
            {t("timeline.saveHint")}
          </p>
        )}
      </main>
      <MyPlansSheet
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
        onLoad={handleLoadPlan}
      />
      <TabBar />
    </div>
  );
}

function SaveButton({
  saving,
  justSaved,
  loggedIn,
  onSave,
}: {
  saving: boolean;
  justSaved: boolean;
  loggedIn: boolean;
  onSave: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={saving}
      data-el="save-button"
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white/50 px-3 py-2 text-xs font-semibold text-muted-foreground shadow-[var(--cc-shadow-sm)] backdrop-blur-md transition active:scale-95 disabled:opacity-60"
    >
      {justSaved && loggedIn ? (
        <>
          <Check className="h-4 w-4 text-primary" />
          {t("timeline.saved")}
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4" />
          {t("timeline.save")}
        </>
      )}
    </button>
  );
}
