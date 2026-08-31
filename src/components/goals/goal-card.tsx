"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Target, Check, Trash2, Ruler, TrendingUp } from "lucide-react";
import { HabitIcon } from "@/components/habits/habit-icon";
import type { GoalDTO, StageDTO, TaskDTO } from "@/lib/api/goals";
import { computeStageProgress, sumCheckedUnits, type Pace } from "@/lib/goals/progress";
import { daysBetween, localDate, type GoalDirection } from "@/lib/goals/types";

export interface GoalCardCallbacks {
  onToggleTask: (goal: GoalDTO, stage: StageDTO, task: TaskDTO, checked: boolean) => void;
  onMeasure: (goal: GoalDTO, value: number) => void;
  onDelete: (goal: GoalDTO) => void;
}

export function GoalCard({
  goal,
  busy,
  callbacks,
}: {
  goal: GoalDTO;
  busy: boolean;
  callbacks: GoalCardCallbacks;
}) {
  const { t } = useTranslation();
  const today = localDate();
  const [measureOpen, setMeasureOpen] = useState(false);
  const [measureVal, setMeasureVal] = useState("");

  const sorted = useMemo(
    () => [...goal.stages].sort((a, b) => a.orderIndex - b.orderIndex),
    [goal.stages],
  );
  const currentStage = sorted.find((s) => s.endDate >= today) ?? sorted[sorted.length - 1];

  const daysLeft = Math.max(0, daysBetween(today, goal.deadline) - 1);

  const progress = currentStage
    ? computeStageProgress({
        startDate: currentStage.startDate,
        endDate: currentStage.endDate,
        checkedUnits: sumCheckedUnits(currentStage.tasks, currentStage.startDate, today),
        taskCount: currentStage.tasks.length,
        today,
        startValue: goal.startValue,
        currentValue: goal.currentValue,
        milestoneValue: currentStage.milestoneValue,
        direction: goal.direction as GoalDirection,
      })
    : null;

  const doneCount = currentStage
    ? currentStage.tasks.filter((tk) => tk.checkedDays.includes(today)).length
    : 0;
  const showValue = goal.startValue != null && goal.targetValue != null;

  const paceText: Record<Pace, string> = {
    behind: t("goals.paceBehind"),
    "on-track": t("goals.paceOnTrack"),
    ahead: t("goals.paceAhead"),
  };

  return (
    <div
      className="rounded-[24px] border border-[rgba(93,135,255,.28)] bg-[linear-gradient(160deg,rgba(240,244,255,.96),rgba(230,238,255,.9))] p-4 shadow-[var(--cc-shadow-sm)]"
      data-el="goal-card"
      data-goal={goal.id}
    >
      {/* 头部：标题 + 倒计时 + 删除 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#3E63DD]">
            <Target className="h-3.5 w-3.5" />
            {t(`goals.kinds.${goal.kind}`)}
          </div>
          <h3 className="mt-0.5 truncate text-[17px] font-bold text-[#28407A]">{goal.title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="rounded-full bg-white/70 px-2.5 py-1 text-center">
            <div className="text-sm font-bold leading-none text-[#3E63DD]">{daysLeft}</div>
            <div className="mt-0.5 text-[9px] leading-none text-[#5B72B8]">{t("goals.daysLeft")}</div>
          </div>
          <button
            type="button"
            onClick={() => callbacks.onDelete(goal)}
            disabled={busy}
            className="rounded-full p-1.5 text-[#8090C0] transition active:scale-90"
            aria-label={t("goals.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 阶段路线图 */}
      <div className="mt-3 flex items-center gap-1" data-el="goal-roadmap">
        {sorted.map((s) => {
          const done = s.endDate < today;
          const active = s.id === currentStage?.id && !done;
          return (
            <div
              key={s.id}
              className={
                "h-1.5 flex-1 rounded-full " +
                (done ? "bg-[#3E63DD]" : active ? "bg-[#7FA0FF]" : "bg-[rgba(93,135,255,.2)]")
              }
              title={s.name}
            />
          );
        })}
      </div>

      {/* 当前阶段 */}
      {currentStage && (
        <div className="mt-3 rounded-2xl bg-white/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[rgba(93,135,255,.14)] text-[#3E63DD]">
                <HabitIcon name={currentStage.icon} className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-bold text-[#28407A]">{currentStage.name}</div>
                <div className="text-[11px] text-[#5B72B8]">
                  {t("goals.todayProgress", {
                    done: doneCount,
                    total: currentStage.tasks.length,
                  })}
                </div>
              </div>
            </div>
          </div>

          {currentStage.focus && (
            <p className="mt-2 text-xs leading-relaxed text-[#4A5A8A]">{currentStage.focus}</p>
          )}

          {/* 每日子任务清单：逐条打卡 */}
          <ul className="mt-3 flex flex-col gap-2" data-el="goal-task-list">
            {currentStage.tasks.map((tk) => {
              const done = tk.checkedDays.includes(today);
              return (
                <li key={tk.id}>
                  <button
                    type="button"
                    onClick={() => callbacks.onToggleTask(goal, currentStage, tk, !done)}
                    disabled={busy}
                    data-el="goal-task"
                    aria-pressed={done}
                    className={
                      "flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition active:scale-[.99] " +
                      (done
                        ? "border-[#3E63DD]/40 bg-[rgba(62,99,221,.1)]"
                        : "border-[rgba(93,135,255,.25)] bg-white/70")
                    }
                  >
                    <span
                      className={
                        "grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition " +
                        (done
                          ? "border-[#3E63DD] bg-[#3E63DD] text-white"
                          : "border-[rgba(93,135,255,.4)] bg-white text-transparent")
                      }
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                    <HabitIcon name={tk.icon} className="h-4 w-4 shrink-0 text-[#3E63DD]" />
                    <span className="min-w-0 flex-1">
                      <span
                        className={
                          "block truncate text-[13px] font-semibold " +
                          (done ? "text-[#3E63DD] line-through" : "text-[#28407A]")
                        }
                      >
                        {tk.name}
                      </span>
                      <span className="block text-[11px] text-[#5B72B8]">
                        {t("goals.dailyUnitLine", { n: tk.dailyTarget, unit: tk.dailyUnit })}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* 进度与节奏（鼓励式，不报红） */}
          {progress && (
            <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-[#3E63DD]">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{paceText[progress.pace]}</span>
            </div>
          )}

          {/* 手动记数值（结果信号） */}
          {showValue && (
            <div className="mt-2">
              {measureOpen ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={measureVal}
                    onChange={(e) => setMeasureVal(e.target.value)}
                    placeholder={t("goals.measurePlaceholder", { unit: goal.valueUnit ?? "" })}
                    className="w-full rounded-full border border-[rgba(93,135,255,.3)] bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#3E63DD]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = Number(measureVal);
                      if (Number.isFinite(v)) {
                        callbacks.onMeasure(goal, v);
                        setMeasureOpen(false);
                        setMeasureVal("");
                      }
                    }}
                    className="shrink-0 rounded-full bg-[#3E63DD] px-3 py-1.5 text-sm font-bold text-white"
                  >
                    {t("goals.save")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setMeasureOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-[rgba(93,135,255,.12)] px-3 py-1.5 text-xs font-semibold text-[#3A57B8]"
                >
                  <Ruler className="h-3.5 w-3.5" />
                  {goal.currentValue != null
                    ? t("goals.currentValue", {
                        v: goal.currentValue,
                        unit: goal.valueUnit ?? "",
                      })
                    : t("goals.recordValue")}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
