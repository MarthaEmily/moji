"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEazo } from "@eazo/sdk/react";
import {
  getWorkoutDay,
  shiftWorkoutDay,
  setWorkoutCompleted,
  type WorkoutDayState,
} from "@/lib/api/workout";
import { nextWorkoutMinutes, isWorkoutCapped } from "@/lib/schedule/workout-shift";
import { localDateStr } from "@/lib/habits/streak";

/** 当前本地时间的「今日分钟数」（0-1439）。 */
function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export interface WorkoutState {
  /** 当前展示用的健身目标分钟数（可能已被后移）。 */
  minutes: number;
  completed: boolean;
  capped: boolean;
  /** 相比原定时间是否已发生后移。 */
  shifted: boolean;
  ready: boolean;
  loggedIn: boolean;
  toggleComplete: () => void;
}

/**
 * 健身时间块状态管理：
 *  - 登录后从数据库读取今日的后移时间与完成状态；
 *  - 到点未完成 -> 每分钟检查一次，自动 +20min 顺延（封顶 24:00），并持久化；
 *  - 完成状态可切换并持久化。
 * baseMinutes 为作息引擎算出的原定健身「起始」分钟（0-1439）。
 */
export function useWorkoutDay(baseMinutes: number): WorkoutState {
  const user = useEazo((s) => s.auth.user);
  const day = localDateStr();

  const [state, setState] = useState<WorkoutDayState | null>(null);
  const [ready, setReady] = useState(false);
  const savingRef = useRef(false);

  // 载入今日状态。
  useEffect(() => {
    let alive = true;
    if (!user) {
      // 用异步微任务规避「在 effect 内同步 setState」的告警。
      queueMicrotask(() => {
        if (!alive) return;
        setState(null);
        setReady(true);
      });
      return () => {
        alive = false;
      };
    }
    getWorkoutDay(day, baseMinutes)
      .then((w) => {
        if (alive) setState(w);
      })
      .catch(() => {
        if (alive) setState(null);
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [user, day, baseMinutes]);

  // 到点未完成 -> 自动后移（每分钟检查一次 + 立即检查一次）。
  const reconcile = useCallback(() => {
    setState((prev) => {
      if (!prev || prev.completed || savingRef.current) return prev;
      const next = nextWorkoutMinutes(prev.shiftedMinutes, nowMinutes());
      if (next === prev.shiftedMinutes) return prev;
      // 乐观更新 + 异步持久化。
      savingRef.current = true;
      shiftWorkoutDay(day, next)
        .then((w) => setState(w))
        .catch(() => undefined)
        .finally(() => {
          savingRef.current = false;
        });
      return { ...prev, shiftedMinutes: next };
    });
  }, [day]);

  useEffect(() => {
    if (!state || state.completed) return;
    reconcile();
    const id = setInterval(reconcile, 60_000);
    return () => clearInterval(id);
  }, [state, reconcile]);

  const toggleComplete = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      const completed = !prev.completed;
      setWorkoutCompleted(day, completed)
        .then((w) => setState(w))
        .catch(() => undefined);
      return { ...prev, completed };
    });
  }, [day]);

  const minutes = state?.shiftedMinutes ?? baseMinutes;
  return {
    minutes,
    completed: state?.completed ?? false,
    capped: isWorkoutCapped(minutes),
    shifted: !!state && state.shiftedMinutes !== state.baseMinutes,
    ready,
    loggedIn: !!user,
    toggleComplete,
  };
}
