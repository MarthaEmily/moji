"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import type { WorkoutWindow } from "@/lib/schedule/engine";
import {
  PlanCard,
  SignInPrompt,
  EmptyState,
  SkeletonList,
} from "@/components/timeline/saved-parts";
import { listPlans, deletePlan, type SavedPlan } from "@/lib/api";

export interface LoadedPlan {
  wakeMinutes: number;
  sleepHours: number;
  workoutWindow: WorkoutWindow;
}

/** 底部抽屉：列出已保存的作息方案，支持载入（回填到时轴）与删除。 */
export function MyPlansSheet({
  open,
  onClose,
  onLoad,
}: {
  open: boolean;
  onClose: () => void;
  onLoad: (plan: LoadedPlan) => void;
}) {
  const { t, i18n } = useTranslation();
  const user = useEazo((s) => s.auth.user);
  const authLoading = useEazo((s) => s.auth.loading);

  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setPlans(await listPlans());
    } catch {
      toast.error(t("toast.loadError"));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  // 打开抽屉时拉取一次最新方案（下一帧再触发，避免同步 setState）。
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [open, load]);

  const handleLoad = (plan: SavedPlan) => {
    onLoad({
      wakeMinutes: plan.wakeMinutes,
      sleepHours: plan.sleepHours,
      workoutWindow: plan.workoutWindow,
    });
    toast.success(t("toast.loadSuccess"));
    onClose();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("saved.deleteConfirm"))) return;
    setDeletingId(id);
    try {
      await deletePlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      toast.success(t("toast.deleteSuccess"));
    } catch {
      toast.error(t("toast.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40" data-el="my-plans-sheet">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      {/* 抽屉 */}
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[82vh] w-full max-w-[460px] flex-col rounded-t-[28px] border border-border bg-[rgba(255,253,248,.98)] shadow-[0_-8px_40px_rgba(0,0,0,.14)]">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <div>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <h2 className="text-[20px] font-bold leading-tight">
              {t("timeline.myPlansTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("saved.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-white/60 text-muted-foreground transition active:scale-90"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-1"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {authLoading || (user && loading) ? (
            <SkeletonList />
          ) : !user ? (
            <SignInPrompt />
          ) : plans.length === 0 ? (
            <EmptyState onGo={onClose} />
          ) : (
            <ul className="flex flex-col gap-3" data-el="saved-list">
              {plans.map((plan) => (
                <li key={plan.id}>
                  <PlanCard
                    plan={plan}
                    locale={i18n.language}
                    deleting={deletingId === plan.id}
                    onLoad={() => handleLoad(plan)}
                    onDelete={() => handleDelete(plan.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
