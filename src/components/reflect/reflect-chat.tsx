"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Send, Sparkles } from "lucide-react";
import { auth } from "@eazo/sdk";
import { useEazo } from "@eazo/sdk/react";
import {
  listReflections,
  sendReflection,
  type ReflectionMessage,
} from "@/lib/api/reflections";
import { localDateStr } from "@/lib/habits/streak";

// 可复用的心得对话核心（无页面外壳/无导航），供左下角悬浮聊天窗使用。
// 默认针对今天的对话，多轮 + 按日期保存 + AI 陪伴人格，均沿用现有后端。
export function ReflectChat() {
  const { t } = useTranslation();
  const user = useEazo((s) => s.auth.user);
  const authLoading = useEazo((s) => s.auth.loading);

  const today = localDateStr();
  const [messages, setMessages] = useState<ReflectionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setMessages(await listReflections(today));
    } catch {
      toast.error(t("reflect.toastError"));
    } finally {
      setLoading(false);
    }
  }, [user, today, t]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    const optimistic: ReflectionMessage = {
      id: `tmp-${Date.now()}`,
      entryDate: today,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const { userMessage, reply } = await sendReflection(today, content);
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

  if (authLoading || (user && loading)) {
    return <div className="flex-1 animate-pulse rounded-2xl bg-white/40" />;
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">{t("reflect.signInPrompt")}</p>
        <button
          type="button"
          onClick={() => auth.login().catch(() => undefined)}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition active:scale-95"
        >
          {t("common.signIn")}
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
        data-el="reflect-thread"
      >
        <div className="flex items-start gap-2 rounded-2xl bg-secondary/25 px-3 py-2.5 text-[13px] leading-relaxed text-[#7A3F1D]">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.2} />
          <span>{t("reflect.intro")}</span>
        </div>

        {messages.length === 0 && (
          <p className="px-1 pt-1 text-[13px] text-muted-foreground">
            {t("reflect.empty")}
          </p>
        )}

        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.content} />
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-white/70 px-3 py-2 text-[13px] text-muted-foreground">
              {t("reflect.sending")}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[rgba(0,0,0,0.05)] p-2">
        <div className="flex items-end gap-2 rounded-2xl border border-[rgba(255,255,255,.72)] bg-white/70 p-1.5">
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
            className="max-h-24 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || !input.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition active:scale-95 disabled:opacity-50"
            aria-label={t("reflect.send")}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

function Bubble({ role, content }: { role: string; content: string }) {
  const mine = role === "user";
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"} data-el={`bubble-${role}`}>
      <div
        className={
          "max-w-[85%] whitespace-pre-wrap px-3 py-2 text-[13px] leading-relaxed " +
          (mine
            ? "rounded-2xl rounded-br-md bg-primary text-primary-foreground"
            : "rounded-2xl rounded-bl-md border border-[rgba(255,255,255,.7)] bg-white/80 text-foreground")
        }
      >
        {content}
      </div>
    </div>
  );
}
