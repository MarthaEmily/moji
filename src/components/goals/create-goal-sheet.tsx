"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Target } from "lucide-react";
import type { CreateGoalInput } from "@/lib/api/goals";
import type { GoalKind } from "@/lib/goals/types";

const KINDS: { key: GoalKind; hasValue: boolean }[] = [
  { key: "study", hasValue: false },
  { key: "exam", hasValue: true },
  { key: "weight", hasValue: true },
  { key: "fitness", hasValue: false },
  { key: "skill", hasValue: false },
  { key: "other", hasValue: false },
];

/** 默认截止日：从今天起 +90 天。 */
function defaultDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function CreateGoalSheet({
  open,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: CreateGoalInput) => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<GoalKind>("study");
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [startLevel, setStartLevel] = useState("");
  const [startValue, setStartValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [valueUnit, setValueUnit] = useState("");

  if (!open) return null;

  const kindMeta = KINDS.find((k) => k.key === kind)!;
  const showValues = kindMeta.hasValue;

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed || !deadline) return;
    const sv = startValue.trim() === "" ? null : Number(startValue);
    const tv = targetValue.trim() === "" ? null : Number(targetValue);
    onSubmit({
      title: trimmed,
      kind,
      deadline,
      startLevel: startLevel.trim() || undefined,
      startValue: showValues && Number.isFinite(sv as number) ? sv : null,
      targetValue: showValues && Number.isFinite(tv as number) ? tv : null,
      valueUnit: showValues && valueUnit.trim() ? valueUnit.trim() : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" data-el="create-goal-sheet">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative max-h-[88dvh] w-full max-w-[460px] overflow-y-auto rounded-t-[28px] border border-[rgba(93,135,255,.25)] bg-[rgba(247,249,255,.98)] p-5 shadow-[var(--cc-shadow-md)]"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#28407A]">
            <Target className="h-5 w-5 text-[#3E63DD]" />
            {t("goals.createTitle")}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-muted-foreground" aria-label={t("common.close")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-3 grid gap-1">
          <span className="text-xs font-semibold text-foreground/80">{t("goals.titleLabel")}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            placeholder={t("goals.titlePlaceholder")}
            className="w-full rounded-2xl border border-[rgba(93,135,255,.3)] bg-white/80 px-3 py-2 text-base text-foreground outline-none focus:ring-2 focus:ring-[#3E63DD]"
          />
        </label>

        <div className="mb-3 grid gap-1">
          <span className="text-xs font-semibold text-foreground/80">{t("goals.kindLabel")}</span>
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k.key}
                type="button"
                onClick={() => setKind(k.key)}
                className={
                  "rounded-full px-3 py-1.5 text-sm font-semibold transition " +
                  (kind === k.key
                    ? "bg-[#3E63DD] text-white"
                    : "bg-[rgba(93,135,255,.12)] text-[#3A57B8]")
                }
              >
                {t(`goals.kinds.${k.key}`)}
              </button>
            ))}
          </div>
        </div>

        <label className="mb-3 grid gap-1">
          <span className="text-xs font-semibold text-foreground/80">{t("goals.levelLabel")}</span>
          <input
            value={startLevel}
            onChange={(e) => setStartLevel(e.target.value)}
            maxLength={80}
            placeholder={t(`goals.levelPlaceholder.${kind}`)}
            className="w-full rounded-2xl border border-[rgba(93,135,255,.3)] bg-white/80 px-3 py-2 text-base text-foreground outline-none focus:ring-2 focus:ring-[#3E63DD]"
          />
          <span className="text-[11px] text-[#5B72B8]">{t("goals.levelHint")}</span>
        </label>

        <label className="mb-3 grid gap-1">
          <span className="text-xs font-semibold text-foreground/80">{t("goals.deadlineLabel")}</span>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-2xl border border-[rgba(93,135,255,.3)] bg-white/80 px-3 py-2 text-base text-foreground outline-none focus:ring-2 focus:ring-[#3E63DD]"
          />
        </label>

        {showValues && (
          <div className="mb-3 grid grid-cols-3 gap-2">
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-foreground/80">{t("goals.startValue")}</span>
              <input
                type="number"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                placeholder={t("goals.now")}
                className="w-full rounded-2xl border border-[rgba(93,135,255,.3)] bg-white/80 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-[#3E63DD]"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-foreground/80">{t("goals.targetValue")}</span>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={t("goals.goal")}
                className="w-full rounded-2xl border border-[rgba(93,135,255,.3)] bg-white/80 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-[#3E63DD]"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-foreground/80">{t("goals.unitLabel")}</span>
              <input
                value={valueUnit}
                onChange={(e) => setValueUnit(e.target.value)}
                maxLength={12}
                placeholder={t("goals.unitPlaceholder")}
                className="w-full rounded-2xl border border-[rgba(93,135,255,.3)] bg-white/80 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-[#3E63DD]"
              />
            </label>
          </div>
        )}

        <p className="mb-4 rounded-2xl bg-[rgba(93,135,255,.12)] px-3 py-2 text-xs text-[#3A57B8]">
          {t("goals.aiHint")}
        </p>

        <button
          type="button"
          onClick={submit}
          disabled={submitting || !title.trim()}
          className="w-full rounded-full bg-[#3E63DD] px-4 py-3 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-60"
        >
          {submitting ? t("goals.planning") : t("goals.create")}
        </button>
      </div>
    </div>
  );
}
