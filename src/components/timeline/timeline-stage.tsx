"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { formatTime, type ScheduleNode, type NodeKey } from "@/lib/schedule/engine";
import { NodeIcon } from "./node-icon";

export interface StageNode extends ScheduleNode {
  rationale: string;
}

export function TimelineStage({
  nodes,
  rationaleLoading,
}: {
  nodes: StageNode[];
  rationaleLoading?: boolean;
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
}: {
  node: StageNode;
  index: number;
  hot: boolean;
  rationaleLoading?: boolean;
  rationaleLabel: string;
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
        </h2>
        <p className="m-0 text-xs leading-relaxed text-muted-foreground">
          {rationaleLoading && !node.rationale ? rationaleLabel : node.rationale}
        </p>
      </div>
    </motion.article>
  );
}
