"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";
import { auth } from "@eazo/sdk";
import { useEazo } from "@eazo/sdk/react";
import { WarmAura } from "@/components/timeline/warm-aura";
import { TabBar } from "@/components/timeline/tab-bar";
import { HabitCard } from "@/components/habits/habit-card";
import { CreateHabitSheet } from "@/components/habits/create-habit-sheet";
import { DecomposeSheet } from "@/components/habits/decompose-sheet";
import {
  HabitSkeletonList,
  HabitSignInCard,
  HabitEmptyCard,
} from "@/components/habits/states";
import {
  listHabits,
  createHabit,
  deleteHabit,
  checkInHabit,
  undoCheckIn,
  adjustHabitTarget,
  batchCreateHabits,
  type HabitWithLogs,
  type CreateHabitInput,
  type SubHabitSuggestion,
} from "@/lib/api/habits";
import { localDateStr } from "@/lib/habits/streak";
import { easeTarget } from "@/lib/habits/growth";
import { countPendingToday } from "@/lib/habits/pending";
import { setPendingCount } from "@/lib/habits/pending-store";
import { PendingBanner } from "@/components/habits/pending-banner";

export default function HabitsPage() {
  const { t } = useTranslation();
  const user = useEazo((s) => s.auth.user);
  const authLoading = useEazo((s) => s.auth.loading);

  const [habits, setHabits] = useState<HabitWithLogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = user ? countPendingToday(habits) : 0;

  // 把未完成数同步给标签栏红点；离开/登出时清零。
  useEffect(() => {
    setPendingCount(pending);
    return () => setPendingCount(0);
  }, [pending]);

  const load = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setHabits(await listHabits());
    } catch {
      toast.error(t("habits.toastError"));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  const handleCreate = async (input: CreateHabitInput) => {
    setSubmitting(true);
    try {
      const habit = await createHabit(input);
      setHabits((prev) => [habit, ...prev]);
      setSheetOpen(false);
      toast.success(t("habits.toastCreated"));
    } catch {
      toast.error(t("habits.toastCreateError"));
    } finally {
      setSubmitting(false);
    }
  };

  // AI 拆解：一键批量创建拆出的小习惯。
  const handleBatchCreate = async (subs: SubHabitSuggestion[]) => {
    setSubmitting(true);
    try {
      const created = await batchCreateHabits(subs);
      setHabits((prev) => [...created, ...prev]);
      setAiOpen(false);
      toast.success(t("habits.toastAiAdded", { count: created.length }));
    } catch {
      toast.error(t("habits.toastAiError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (habit: HabitWithLogs, checked: boolean) => {
    const today = localDateStr();
    setBusyId(habit.id);
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id
          ? {
              ...h,
              logDates: checked
                ? [today, ...h.logDates.filter((d) => d !== today)]
                : h.logDates.filter((d) => d !== today),
            }
          : h,
      ),
    );
    try {
      if (checked) {
        await checkInHabit(habit.id, today);
        toast.success(t("habits.toastCheckIn"));
      } else {
        await undoCheckIn(habit.id, today);
      }
    } catch {
      toast.error(t("habits.toastError"));
      void load();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (habit: HabitWithLogs) => {
    if (!window.confirm(t("habits.deleteConfirm"))) return;
    setBusyId(habit.id);
    try {
      await deleteHabit(habit.id);
      setHabits((prev) => prev.filter((h) => h.id !== habit.id));
      toast.success(t("habits.toastDeleted"));
    } catch {
      toast.error(t("habits.toastError"));
    } finally {
      setBusyId(null);
    }
  };

  // 采纳加量：更新目标量，并把本次连续天数记为基准防重复提示。
  const handleBump = async (habit: HabitWithLogs, to: number, streak: number) => {
    setBusyId(habit.id);
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id ? { ...h, targetAmount: to, lastBumpStreak: streak } : h,
      ),
    );
    try {
      await adjustHabitTarget(habit.id, to, streak);
      toast.success(t("habits.toastBumped"));
    } catch {
      toast.error(t("habits.toastError"));
      void load();
    } finally {
      setBusyId(null);
    }
  };

  // “有点难”：下调目标量，并抬高基准避免短期再次建议。
  const handleEase = async (habit: HabitWithLogs) => {
    const to = easeTarget(habit.targetAmount, habit.baseAmount);
    const guard = habit.lastBumpStreak + 999; // 抬高基准，短期不再建议
    setBusyId(habit.id);
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id ? { ...h, targetAmount: to, lastBumpStreak: guard } : h,
      ),
    );
    try {
      await adjustHabitTarget(habit.id, to, guard);
      toast.success(t("habits.toastEased"));
    } catch {
      toast.error(t("habits.toastError"));
      void load();
    } finally {
      setBusyId(null);
    }
  };

  const showList = user && !loading && habits.length > 0;
  const showEmpty = user && !loading && habits.length === 0;

  return (
    <div className="relative flex min-h-full justify-center">
      <WarmAura />
      <main
        className="flex w-full max-w-[460px] flex-col gap-4 px-[18px]"
        style={{
          paddingTop: "max(56px, env(safe-area-inset-top, 0px))",
          paddingBottom: "calc(80px + max(34px, env(safe-area-inset-bottom, 0px)))",
        }}
      >
        <header data-el="habits-header">
          <h1 className="text-[30px] font-bold leading-tight tracking-tight">
            {t("habits.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("habits.subtitle")}</p>
        </header>

        {authLoading || (user && loading) ? (
          <HabitSkeletonList />
        ) : !user ? (
          <HabitSignInCard
            onSignIn={() => auth.login().catch(() => undefined)}
            label={t("habits.signInPrompt")}
            cta={t("common.signIn")}
          />
        ) : showEmpty ? (
          <HabitEmptyCard
            onAdd={() => setSheetOpen(true)}
            text={t("habits.empty")}
            cta={t("habits.addCta")}
          />
        ) : showList ? (
          <>
            <PendingBanner pending={pending} />
            <ul className="flex flex-col gap-3" data-el="habit-list">
              {habits.map((h) => (
                <li key={h.id}>
                <HabitCard
                  habit={h}
                  busy={busyId === h.id}
                  onToggle={(checked) => handleToggle(h, checked)}
                  onDelete={() => handleDelete(h)}
                  onBump={(to, streak) => handleBump(h, to, streak)}
                  onEase={() => handleEase(h)}
                />
              </li>
            ))}
            </ul>
          </>
        ) : null}
      </main>

      {user && (
        <div
          className="fixed right-5 z-30 flex flex-col items-end gap-3"
          style={{ bottom: "calc(84px + max(34px, env(safe-area-inset-bottom, 0px)))" }}
        >
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            data-el="ai-decompose-fab"
            className="flex items-center gap-1.5 rounded-full bg-[rgba(255,253,248,.92)] px-4 py-2.5 text-sm font-bold text-[#7A3F1D] shadow-[var(--cc-shadow-md)] backdrop-blur transition active:scale-95"
          >
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={2.2} />
            {t("habits.aiCta")}
          </button>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            data-el="add-habit-fab"
            className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--cc-shadow-md)] transition active:scale-95"
            aria-label={t("habits.addCta")}
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      )}

      <CreateHabitSheet
        open={sheetOpen}
        submitting={submitting}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleCreate}
      />

      <DecomposeSheet
        open={aiOpen}
        submitting={submitting}
        onClose={() => setAiOpen(false)}
        onConfirm={handleBatchCreate}
      />

      <TabBar />
    </div>
  );
}
