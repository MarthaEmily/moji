"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Send, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { auth } from "@eazo/sdk";
import { useEazo } from "@eazo/sdk/react";
import { WarmAura } from "@/components/timeline/warm-aura";
import { TabBar } from "@/components/timeline/tab-bar";
import { HabitSignInCard } from "@/components/habits/states";
import {
  listReflections,
  sendReflection,
  type ReflectionMessage,
} from "@/lib/api/reflections";
import { localDateStr } from "@/lib/habits/streak";

function shiftDate(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return localDateStr(dt);
}

export function ReflectScreen() {
  const { t } = useTranslation();
  const user = useEazo((s) => s.auth.user);
  const authLoading = useEazo((s) => s.auth.loading);

  const today = localDateStr();
  const [date, setDate] = useState(today);
  const [messages, setMessages] = useState<ReflectionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isToday = date === today;

  const load = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setMessages(await listReflections(date));
    } catch {
      toast.error(t("reflect.toastError"));
    } finally {
      setLoading(false);
    }
  }, [user, date, t]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    // 乐观插入用户气泡
    const optimistic: ReflectionMessage = {
      id: `tmp-${Date.now()}`,
      entryDate: date,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const { userMessage, reply } = await sendReflection(date, content);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        userMessage,
        reply,
      ]);
    } catch {
      toast.error(t("reflect.toastError"));
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const dateLabel = isToday ? t("reflect.today") : date;

  return (
    <div className="relative flex min-h-full justify-center">
      <WarmAura />
      <div
        className="flex w-full max-w-[460px] flex-col px-[18px]"
        style={{
          paddingTop: "max(56px, env(safe-area-inset-top, 0px))",
          height: "100dvh",
        }}
      >
        <header data-el="reflect-header" className="shrink-0">
          <h1 className="text-[30px] font-bold leading-tight tracking-tight">
            {t("reflect.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("reflect.subtitle")}</p>
          {/* 日期切换 */}
          <div className="mt-3 flex items-center justify-center gap-3 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setDate((d) => shiftDate(d, -1))}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/60 text-muted-foreground"
              aria-label="prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span data-el="reflect-date" className="min-w-[96px] text-center text-foreground">
              {dateLabel}
            </span>
            <button
              type="button"
              onClick={() => setDate((d) => (d < today ? shiftDate(d, 1) : d))}
              disabled={isToday}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/60 text-muted-foreground disabled:opacity-40"
              aria-label="next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        {authLoading || (user && loading) ? (
          <div className="mt-6 flex-1 animate-pulse rounded-[24px] bg-white/40" />
        ) : !user ? (
          <HabitSignInCard
            onSignIn={() => auth.login().catch(() => undefined)}
            label={t("reflect.signInPrompt")}
            cta={t("common.signIn")}
          />
        ) : (
          <>
            <div
              ref={scrollRef}
              className="mt-3 flex-1 space-y-3 overflow-y-auto pb-3"
              data-el="reflect-thread"
            >
              {/* 开场引导 */}
              <div className="flex items-start gap-2 rounded-2xl bg-secondary/25 px-4 py-3 text-sm text-[#7A3F1D]">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.2} />
                <span>{t("reflect.intro")}</span>
              </div>

              {messages.length === 0 && (
                <p className="px-1 pt-2 text-sm text-muted-foreground">{t("reflect.empty")}</p>
              )}

              {messages.map((m) => (
                <Bubble key={m.id} role={m.role} content={m.content} />
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-white/70 px-4 py-2.5 text-sm text-muted-foreground">
                    {t("reflect.sending")}
                  </div>
                </div>
              )}
            </div>

            {/* 输入区 */}
            <div
              className="shrink-0 pt-2"
              style={{ paddingBottom: "calc(80px + max(34px, env(safe-area-inset-bottom, 0px)))" }}
            >
              <div className="flex items-end gap-2 rounded-3xl border border-[rgba(255,255,255,.72)] bg-[rgba(255,253,248,.96)] p-2 shadow-[var(--cc-shadow-sm)]">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder={t("reflect.placeholder")}
                  className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-base text-foreground outline-none"
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={sending || !input.trim()}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition active:scale-95 disabled:opacity-50"
                  aria-label={t("reflect.send")}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <TabBar />
    </div>
  );
}

function Bubble({ role, content }: { role: string; content: string }) {
  const mine = role === "user";
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"} data-el={`bubble-${role}`}>
      <div
        className={
          "max-w-[82%] whitespace-pre-wrap px-4 py-2.5 text-sm leading-relaxed " +
          (mine
            ? "rounded-2xl rounded-br-md bg-primary text-primary-foreground"
            : "rounded-2xl rounded-bl-md bg-white/80 text-foreground border border-[rgba(255,255,255,.7)]")
        }
      >
        {content}
      </div>
    </div>
  );
}
