"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Sunrise, CircleCheckBig } from "lucide-react";
import { usePendingCount } from "@/lib/habits/pending-store";

const TABS = [
  { href: "/", key: "habits", Icon: CircleCheckBig },
  { href: "/timeline", key: "timeline", Icon: Sunrise },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const pending = usePendingCount();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[460px] justify-around border-t border-border bg-[rgba(255,253,248,.9)] px-4 pt-1 backdrop-blur-xl"
      style={{ paddingBottom: "max(34px, env(safe-area-inset-bottom, 0px))" }}
      data-el="tab-bar"
    >
      {TABS.map(({ href, key, Icon }) => {
        const active = pathname === href;
        const showBadge = key === "habits" && pending > 0;
        return (
          <Link
            key={href}
            href={href}
            data-el={`nav-${key}`}
            className={
              "flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1 text-xs font-semibold transition " +
              (active ? "text-primary" : "text-muted-foreground")
            }
          >
            <span className="relative">
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              {showBadge && (
                <span
                  data-el="habits-pending-badge"
                  className="absolute -right-2 -top-1.5 grid min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-[16px] text-primary-foreground"
                >
                  {pending > 9 ? "9+" : pending}
                </span>
              )}
            </span>
            {t(`app.nav.${key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
