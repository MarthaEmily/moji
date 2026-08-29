"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useEazo } from "@eazo/sdk/react";
import { WarmAura } from "@/components/timeline/warm-aura";
import { TabBar } from "@/components/timeline/tab-bar";
import {
  PlanCard,
  SignInPrompt,
  EmptyState,
  SkeletonList,
} from "@/components/timeline/saved-parts";
import { listPlans, deletePlan, type SavedPlan } from "@/lib/api";

export default function SavedPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
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

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  const handleLoad = (plan: SavedPlan) => {
    try {
      sessionStorage.setItem(
        "cc-load-plan",
        JSON.stringify({
          wakeMinutes: plan.wakeMinutes,
          sleepHours: plan.sleepHours,
          workoutWindow: plan.workoutWindow,
        }),
      );
    } catch {
      /* ignore */
    }
    toast.success(t("toast.loadSuccess"));
    router.push("/");
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

  return (
    <div className="relative flex min-h-full justify-center">
      <WarmAura />
      <main
        className="flex w-full max-w-[460px] flex-col gap-4 px-[18px]"
        style={{
          paddingTop: "max(56px, env(safe-area-inset-top, 0px))",
          paddingBottom:
            "calc(80px + max(34px, env(safe-area-inset-bottom, 0px)))",
        }}
      >
        <header data-el="saved-header">
          <h1 className="text-[30px] font-bold leading-tight tracking-tight">
            {t("saved.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("saved.subtitle")}</p>
        </header>

        {authLoading || (user && loading) ? (
          <SkeletonList />
        ) : !user ? (
          <SignInPrompt />
        ) : plans.length === 0 ? (
          <EmptyState onGo={() => router.push("/")} />
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
      </main>
      <TabBar />
    </div>
  );
}
