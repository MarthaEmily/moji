"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { formatTime, type ScheduleNode, type NodeKey } from "@/lib/schedule/engine";
import { NodeIcon } from "./node-icon";

export interface StageNode extends ScheduleNode {
  rationale: string;
}

/** 健身时间块的实时状态与操作（由时轴页注入）。 */
export interface WorkoutControl {
  completed: boolean;
  capped: boolean;
  shifted: boolean;
  loggedIn: boolean;
  onToggle: () => void;
}

export function TimelineStage({
  nodes,
  rationaleLoading,
  workout,
}: {
  nodes: StageNode[];
  rationaleLoading?: boolean;
  workout?: WorkoutControl;
}) {
  const { t } = useTranslation();
  return (
    <section
      className="relative flex-1 py-1"
      aria-label={t("app.title")}
      data-el="timeline-stage"
    >
      {/* 渐变竖线 */}
      <div
        className="cc-timeline-line absolute left-[42px] top-5 bottom-4 w-[3px] rounded-full"
        aria-hidden
      />
      <div className="flex flex-col gap-1.5">
        {nodes.map((node, i) => (
          <TimelineNode
            key={node.key}
            node={node}
            index={i}
            hot={node.key === "workout"}
            rationaleLoading={rationaleLoading}
            rationaleLabel={t("timeline.rationaleLoading")}
            workout={node.key === "workout" ? workout : undefined}
          />
        ))}
      </div>
    </section>
  );
}

function TimelineNode({
  node,
  index,
  hot,
  rationaleLoading,
  rationaleLabel,
  workout,
}: {
  node: StageNode;
  index: number;
  hot: boolean;
  rationaleLoading?: boolean;
  rationaleLabel: string;
  workout?: WorkoutControl;
}) {
  const { t } = useTranslation();
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.28, ease: "easeOut" }}
      className="relative grid grid-cols-[84px_minmax(0,1fr)] items-center"
      data-el="timeline-node"
      data-node={node.key}
    >
      <div
        className={
          "z-[1] grid h-12 w-[72px] place-items-center rounded-[24px] text-lg font-bold tabular-nums " +
          (hot
            ? "text-[#6C3B15]"
            : "bg-[rgba(255,250,242,.82)] text-primary shadow-[var(--cc-shadow-sm)]")
        }
        style={
          hot
            ? { background: "linear-gradient(135deg,#fff8e7,#FFD166)" }
            : undefined
        }
      >
        {formatTime(node.minutes)}
      </div>
      <div className="min-w-0 py-1.5 pl-1">
        <h2
          className={
            "mb-0.5 flex items-center gap-1.5 text-[15px] font-semibold leading-tight " +
            (hot ? "text-[#7A3F1D]" : "text-foreground")
          }
        >
          <NodeIcon nodeKey={node.key as NodeKey} className="h-4 w-4 text-primary" />
          {t(`nodes.${node.key}`)}
          {workout && (
            <button
              type="button"
              onClick={workout.onToggle}
              data-el="workout-toggle"
              aria-pressed={workout.completed}
              aria-label={workout.completed ? t("workout.doneAria") : t("workout.doAria")}
              className={
                "ml-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition active:scale-95 " +
                (workout.completed
                  ? "border-primary/40 bg-primary text-primary-foreground"
                  : "border-[rgba(122,63,29,.28)] bg-white/70 text-[#7A3F1D]")
              }
            >
              <Check className="h-3 w-3" strokeWidth={2.6} />
              {workout.completed ? t("workout.done") : t("workout.checkIn")}
            </button>
          )}
        </h2>
        <p className="m-0 text-xs leading-relaxed text-muted-foreground">
          {rationaleLoading && !node.rationale ? rationaleLabel : node.rationale}
        </p>
        {/* 健身温和提示：只鼓励，不催、不报红。 */}
        {workout && !workout.completed && workout.loggedIn && (
          <p className="mt-1 text-[11px] leading-relaxed text-primary/90" data-el="workout-hint">
            {workout.capped
              ? t("workout.capped")
              : workout.shifted
                ? t("workout.shifted")
                : t("workout.gentle")}
          </p>
        )}
        {workout && workout.completed && (
          <p className="mt-1 text-[11px] font-medium leading-relaxed text-primary" data-el="workout-hint">
            {t("workout.celebrate")}
          </p>
        )}
      </div>
    </motion.article>
  );
}
