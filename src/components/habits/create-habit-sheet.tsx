"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { HabitIcon, HABIT_ICON_KEYS } from "./habit-icon";
import type { CreateHabitInput } from "@/lib/api/habits";

interface Preset {
  key: string;
  name: string;
  amount: number;
  unit: string;
  icon: string;
}

// 「从最小值起步」的快速预设（阶段三加量引擎会在此基础上成长）。
const PRESETS: Preset[] = [
  { key: "vocab", name: "背单词", amount: 5, unit: "个", icon: "language" },
  { key: "squat", name: "深蹲", amount: 1, unit: "分钟", icon: "dumbbell" },
  { key: "water", name: "喝水", amount: 8, unit: "杯", icon: "water" },
  { key: "read", name: "阅读", amount: 10, unit: "分钟", icon: "book" },
];

export function CreateHabitSheet({
  open,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: CreateHabitInput) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(5);
  const [unit, setUnit] = useState("个");
  const [icon, setIcon] = useState("sparkles");

  if (!open) return null;

  const applyPreset = (p: Preset) => {
    setName(p.name);
    setAmount(p.amount);
    setUnit(p.unit);
    setIcon(p.icon);
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed || amount < 1) return;
    onSubmit({ name: trimmed, targetAmount: amount, unit: unit.trim() || "次", icon });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" data-el="create-habit-sheet">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[460px] rounded-t-[28px] border border-[rgba(255,255,255,.72)] bg-[rgba(255,253,248,.96)] p-5 shadow-[var(--cc-shadow-md)]"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{t("habits.createTitle")}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-muted-foreground" aria-label={t("common.close")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 快速预设 */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("habits.presetTitle")}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p)}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1.5 text-sm font-semibold text-[#7A3F1D]"
              >
                <HabitIcon name={p.icon} className="h-4 w-4" />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <label className="mb-3 grid gap-1">
          <span className="text-xs font-semibold text-foreground/80">{t("habits.nameLabel")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder={t("habits.namePlaceholder")}
            className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-base text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <div className="mb-3 grid grid-cols-[1fr_1fr] gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-foreground/80">{t("habits.amountLabel")}</span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-base text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-foreground/80">{t("habits.unitLabel")}</span>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              maxLength={12}
              placeholder={t("habits.unitPlaceholder")}
              className="w-full rounded-2xl border border-border bg-white/70 px-3 py-2 text-base text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>

        {/* 图标选择 */}
        <div className="mb-3 grid gap-1">
          <span className="text-xs font-semibold text-foreground/80">{t("habits.iconLabel")}</span>
          <div className="flex flex-wrap gap-2">
            {HABIT_ICON_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setIcon(k)}
                className={
                  "grid h-9 w-9 place-items-center rounded-xl border transition " +
                  (icon === k ? "border-primary bg-primary/12 text-primary" : "border-border bg-white/50 text-muted-foreground")
                }
                aria-label={k}
              >
                <HabitIcon name={k} className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <p className="mb-4 rounded-2xl bg-secondary/25 px-3 py-2 text-xs text-[#7A3F1D]">{t("habits.minHint")}</p>

        <button
          type="button"
          onClick={submit}
          disabled={submitting || !name.trim()}
          className="w-full rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition active:scale-[.98] disabled:opacity-60"
        >
          {t("habits.add")}
        </button>
      </div>
    </div>
  );
}
