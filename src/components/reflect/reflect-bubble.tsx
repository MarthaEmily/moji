"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { ReflectChat } from "@/components/reflect/reflect-chat";

// 左下角猫猫悬浮泡泡 + 弹出小聊天窗。
// 刻意放左下角，避开右下角的「添加习惯 / AI 拆解」按钮，避免用户混淆。
export function ReflectBubble() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 封面截图页不显示泡泡。
  if (pathname?.startsWith("/eazo-cover-preview")) return null;

  return (
    <>
      {/* 弹出的小聊天窗 */}
      {open && (
        <div
          data-el="reflect-chat-window"
          className="fixed left-4 z-[70] flex w-[min(360px,calc(100vw-32px))] flex-col overflow-hidden rounded-[24px] border border-[rgba(255,255,255,.72)] bg-[rgba(255,253,248,.98)] shadow-[0_18px_48px_rgba(232,128,64,0.28)]"
          style={{
            bottom: "calc(150px + max(34px, env(safe-area-inset-bottom, 0px)))",
            height: "min(60vh, 520px)",
          }}
        >
          {/* 顶栏：猫猫 + 标题 + 关闭 */}
          <div className="flex shrink-0 items-center gap-2.5 border-b border-[rgba(0,0,0,0.05)] bg-white/50 px-3 py-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="莫急"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover shadow-[0_4px_12px_rgba(232,128,64,0.25)]"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold leading-none text-foreground">
                {t("reflect.title")}
              </div>
              <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {t("reflect.subtitle")}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-black/5"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ReflectChat />
        </div>
      )}

      {/* 悬浮泡泡（猫猫头像） */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-el="reflect-bubble"
        aria-label={t("reflect.title")}
        className="fixed left-4 z-[70] grid h-14 w-14 place-items-center rounded-full border border-[rgba(255,255,255,.7)] bg-[rgba(255,253,248,.96)] shadow-[0_10px_28px_rgba(232,128,64,0.32)] transition active:scale-95"
        style={{
          bottom: "calc(84px + max(34px, env(safe-area-inset-bottom, 0px)))",
        }}
      >
        {open ? (
          <X className="h-5 w-5 text-[#7A3F1D]" />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="莫急"
              width={56}
              height={56}
              className="h-full w-full rounded-full object-cover"
            />
            <span className="cc-bubble-breathe pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary/30" />
          </>
        )}
      </button>

      <style>{`
        @keyframes cc-bubble-breathe {
          0%, 100% { transform: scale(1); opacity: .55; }
          50% { transform: scale(1.12); opacity: 0; }
        }
        .cc-bubble-breathe { animation: cc-bubble-breathe 2.6s ease-in-out infinite; }
      `}</style>
    </>
  );
}
