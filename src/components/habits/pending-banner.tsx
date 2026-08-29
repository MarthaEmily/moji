"use client";

import { useTranslation } from "react-i18next";
import { CircleAlert, PartyPopper } from "lucide-react";

// 今日未完成提醒条：有未完成显示提醒 + 跳转按钮；全部完成显示庆祝。
export function PendingBanner({ pending }: { pending: number }) {
  const { t } = useTranslation();

  if (pending <= 0) {
    return (
      <div
        data-el="pending-banner-done"
        className="flex items-center gap-2 rounded-2xl border border-[rgba(255,255,255,.6)] bg-secondary/25 px-4 py-2.5 text-sm font-semibold text-[#2f7a3f]"
      >
        <PartyPopper className="h-4 w-4 shrink-0" strokeWidth={2.2} />
        {t("habits.pendingBannerDone")}
      </div>
    );
  }

  const jump = () => {
    const first = document.querySelector<HTMLElement>(
      '[data-el="habit-list"] li',
    );
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div
      data-el="pending-banner"
      className="flex items-center gap-2 rounded-2xl border border-[rgba(255,255,255,.6)] bg-primary/12 px-4 py-2.5 text-sm font-semibold text-[#7A3F1D]"
    >
      <CircleAlert className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.2} />
      <span className="min-w-0 flex-1">
        {t("habits.pendingBannerAll", { count: pending })}
      </span>
      <button
        type="button"
        onClick={jump}
        className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground transition active:scale-95"
      >
        {t("habits.pendingJump")}
      </button>
    </div>
  );
}
