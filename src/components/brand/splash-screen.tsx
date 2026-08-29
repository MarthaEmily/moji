"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const SESSION_KEY = "moji-splash-shown.v1";

// 品牌欢迎/加载画面：暖光背景 + 慵懒三花猫 Logo + 「莫急」标题。
// 每个会话只显示一次，约 1.8 秒后自动淡出，不打扰。
export function SplashScreen() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let shown = false;
    try {
      shown = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      shown = false;
    }
    if (shown) return;

    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }

    // 推迟到 effect 之后再置状态，避免 effect 内同步 setState 的告警。
    const showTimer = setTimeout(() => setShow(true), 0);
    const leaveTimer = setTimeout(() => setLeaving(true), 1600);
    const hideTimer = setTimeout(() => setShow(false), 2200);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(leaveTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      data-el="splash-screen"
      aria-hidden
      className={
        "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[#F0E8E0] transition-opacity duration-500 " +
        (leaving ? "pointer-events-none opacity-0" : "opacity-100")
      }
    >
      {/* 暖橙光晕 */}
      <div
        className="pointer-events-none absolute left-1/2 top-[42%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(232,128,64,0.28), transparent 70%)" }}
      />

      <div className="relative flex flex-col items-center gap-5">
        <div className="cc-splash-breathe">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt={t("app.brandName")}
            width={148}
            height={148}
            className="h-[148px] w-[148px] rounded-[36px] object-cover shadow-[0_18px_48px_rgba(232,128,64,0.28)]"
          />
        </div>
        <div className="text-center">
          <h1 className="text-[30px] font-bold tracking-tight text-[#3a2a1e]">
            {t("app.brandName")}
          </h1>
          <p className="mt-1 text-sm text-[#8a6a52]">{t("app.tagline")}</p>
        </div>
      </div>

      <style>{`
        @keyframes cc-splash-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.045); }
        }
        .cc-splash-breathe {
          animation: cc-splash-breathe 3.2s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
