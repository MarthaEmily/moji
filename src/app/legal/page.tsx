"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ShieldCheck, FileText } from "lucide-react";
import { WarmAura } from "@/components/timeline/warm-aura";

interface Clause {
  h: string;
  p: string;
}

export default function LegalPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const privacy = t("legal.privacySections", { returnObjects: true }) as Clause[];
  const terms = t("legal.termsSections", { returnObjects: true }) as Clause[];

  return (
    <div className="relative flex min-h-full justify-center">
      <WarmAura />
      <main
        className="flex w-full max-w-[460px] flex-col gap-5 px-[18px]"
        style={{
          paddingTop: "max(56px, env(safe-area-inset-top, 0px))",
          paddingBottom: "calc(40px + max(34px, env(safe-area-inset-bottom, 0px)))",
        }}
      >
        <header className="flex flex-col gap-3" data-el="legal-header">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex w-fit items-center gap-1.5 rounded-full border border-border bg-white/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur-md transition active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("legal.back")}
          </button>
          <div>
            <h1 className="text-[28px] font-bold leading-tight tracking-tight">
              {t("legal.entry")}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">{t("legal.updated")}</p>
          </div>
        </header>

        {/* 隐私政策 */}
        <section
          className="rounded-[24px] border border-[rgba(255,255,255,.72)] bg-[rgba(255,253,248,.82)] p-5 shadow-[var(--cc-shadow-sm)] backdrop-blur-xl"
          data-el="privacy-section"
        >
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-lg font-bold text-foreground">{t("legal.privacyTitle")}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("legal.privacyIntro")}
          </p>
          <div className="mt-4 flex flex-col gap-4">
            {privacy.map((c, i) => (
              <div key={i}>
                <h3 className="text-sm font-bold text-foreground">{c.h}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{c.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 用户协议 */}
        <section
          className="rounded-[24px] border border-[rgba(255,255,255,.72)] bg-[rgba(255,253,248,.82)] p-5 shadow-[var(--cc-shadow-sm)] backdrop-blur-xl"
          data-el="terms-section"
        >
          <div className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-bold text-foreground">{t("legal.termsTitle")}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("legal.termsIntro")}
          </p>
          <div className="mt-4 flex flex-col gap-4">
            {terms.map((c, i) => (
              <div key={i}>
                <h3 className="text-sm font-bold text-foreground">{c.h}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{c.p}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
