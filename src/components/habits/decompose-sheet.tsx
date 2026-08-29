"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Sparkles, Trash2 } from "lucide-react";
import { HabitIcon } from "./habit-icon";
import { decomposeGoal, type SubHabitSuggestion } from "@/lib/api/habits";
import { toast } from "sonner";

export function DecomposeSheet({
  open,
  submitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (subs: SubHabitSuggestion[]) => void;
}) {
  const { t } = useTranslation();
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [subs, setSubs] = useState<SubHabitSuggestion[] | null>(null);
  const [fallback, setFallback] = useState(false);

  if (!open) return null;

  const reset = () => {
    setGoal("");
    setSubs(null);
    setFallback(false);
  };
  const close = () => {
    reset();
    onClose();
  };

  const generate = async () => {
    const g = goal.trim();
    if (!g) return;
    setLoading(true);
    try {
      const { subHabits, source } = await decomposeGoal(g);
      setSubs(subHabits);
      setFallback(source === "fallback");
    } catch {
      toast.error(t("habits.toastAiError"));
    } finally {
      setLoading(false);
    }
  };

  const removeAt = (i: number) =>
    setSubs((prev) => (prev ? prev.filter((_, idx) => idx !== i) : prev));

  const editAmount = (i: number, v: number) =>
    setSubs((prev) =>
      prev ? prev.map((s, idx) => (idx === i ? { ...s, targetAmount: Math.max(1, v || 1) } : s)) : prev,
    );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" data-el="decompose-sheet">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={close} />
      <div
        className="relative flex max-h-[86vh] w-full max-w-[460px] flex-col rounded-t-[28px] border border-[rgba(255,255,255,.72)] bg-[rgba(255,253,248,.96)] p-5 shadow-[var(--cc-shadow-md)]"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-lg font-bold text-foreground">
            <Sparkles className="h-5 w-5 text-primary" strokeWidth={2.2} />
            {t("habits.aiTitle")}
          </h2>
          <button type="button" onClick={close} className="rounded-full p-1 text-muted-foreground" aria-label={t("common.close")}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{t("habits.aiSubtitle")}</p>

        <div className="mb-3 flex gap-2">
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            maxLength={60}
            placeholder={t("habits.aiGoalPlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") void generate();
            }}
            className="min-w-0 flex-1 rounded-2xl border border-border bg-white/70 px-3 py-2 text-base text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading || !goal.trim()}
            className="shrink-0 rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition active:scale-[.98] disabled:opacity-60"
          >
            {loading ? t("habits.aiGenerating") : t("habits.aiGenerate")}
          </button>
        </div>

        {subs && (
          <div className="flex min-h-0 flex-1 flex-col">
            {fallback && (
              <p className="mb-2 rounded-2xl bg-secondary/25 px-3 py-2 text-xs text-[#7A3F1D]">
                {t("habits.aiFallbackHint")}
              </p>
            )}
            <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("habits.aiResultTitle")}</p>
            {subs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("habits.aiEmpty")}</p>
            ) : (
              <ul className="flex-1 space-y-2 overflow-y-auto pb-2">
                {subs.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-white/60 px-3 py-2"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                      <HabitIcon name={s.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{s.name}</span>
                    <input
                      type="number"
                      min={1}
                      value={s.targetAmount}
                      onChange={(e) => editAmount(i, Number(e.target.value))}
                      className="w-14 rounded-lg border border-border bg-white/70 px-2 py-1 text-center text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="shrink-0 text-xs text-muted-foreground">{s.unit}</span>
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      className="shrink-0 rounded-full p-1 text-muted-foreground"
                      aria-label={t("habits.aiRemove")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => onConfirm(subs)}
              disabled={submitting || subs.length === 0}
              className="mt-2 w-full rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition active:scale-[.98] disabled:opacity-60"
            >
              {t("habits.aiAddAll", { count: subs.length })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
