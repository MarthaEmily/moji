"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertTriangle, Bookmark, Check } from "lucide-react";
import { auth } from "@eazo/sdk";
import { useEazo } from "@eazo/sdk/react";
import { WarmAura } from "@/components/timeline/warm-aura";
import { TimelineStage, type StageNode } from "@/components/timeline/timeline-stage";
import { ControlBar } from "@/components/timeline/control-bar";
import { TabBar } from "@/components/timeline/tab-bar";
import { computeSchedule, type WorkoutWindow } from "@/lib/schedule/engine";
import { FALLBACK_RATIONALE } from "@/lib/schedule/rationale";
import { generateRationales, savePlan } from "@/lib/api";
import { DEFAULT_PLAN_INPUT, type PlanInput } from "@/stores/plan-store";

/** 首渲染时读取由「我的方案」页面暂存的载入选择（客户端组件，可安全读 sessionStorage）。 */
function readInitialInput(): PlanInput {
  if (typeof window === "undefined") return DEFAULT_PLAN_INPUT;
  try {
    const raw = sessionStorage.getItem("cc-load-plan");
    if (!raw) return DEFAULT_PLAN_INPUT;
    const p = JSON.parse(raw) as Partial<PlanInput>;
    sessionStorage.removeItem("cc-load-plan");
    return {
      wakeMinutes:
        typeof p.wakeMinutes === "number" ? p.wakeMinutes : DEFAULT_PLAN_INPUT.wakeMinutes,
      sleepHours:
        typeof p.sleepHours === "number" ? p.sleepHours : DEFAULT_PLAN_INPUT.sleepHours,
      workoutWindow: p.workoutWindow ?? DEFAULT_PLAN_INPUT.workoutWindow,
    };
  } catch {
    return DEFAULT_PLAN_INPUT;
  }
}

export default function TimelinePage() {
  const { t } = useTranslation();
  const user = useEazo((s) => s.auth.user);

  const initial = useState(readInitialInput)[0];
  const [wakeMinutes, setWakeMinutes] = useState(initial.wakeMinutes);
  const [sleepHours, setSleepHours] = useState(initial.sleepHours);
  const [workoutWindow, setWorkoutWindow] = useState<WorkoutWindow>(
    initial.workoutWindow,
  );
  const [rationales, setRationales] = useState<Partial<Record<string, string>>>({});
  const [loadingRationale, setLoadingRationale] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const result = useMemo(
    () => computeSchedule({ wakeMinutes, sleepHours, workoutWindow }),
    [wakeMinutes, sleepHours, workoutWindow],
  );

  // 载入 saved 页面选择的方案已在惰性初始化中处理（readInitialInput）。

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
          <SaveButton
            saving={saving}
            justSaved={justSaved}
            loggedIn={!!user}
            onSave={handleSave}
          />
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

        <TimelineStage nodes={nodes} rationaleLoading={loadingRationale} />

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
