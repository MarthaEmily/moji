"use client";

import {
  Sparkles,
  BookOpen,
  Dumbbell,
  GlassWater,
  Footprints,
  Brain,
  PenLine,
  Moon,
  Languages,
  Apple,
  type LucideIcon,
} from "lucide-react";

// 习惯可选图标集（存 icon 名，渲染时映射）。
export const HABIT_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  book: BookOpen,
  dumbbell: Dumbbell,
  water: GlassWater,
  steps: Footprints,
  brain: Brain,
  pen: PenLine,
  moon: Moon,
  language: Languages,
  apple: Apple,
};

export const HABIT_ICON_KEYS = Object.keys(HABIT_ICONS);

export function HabitIcon({ name, className }: { name: string; className?: string }) {
  const Icon = HABIT_ICONS[name] ?? Sparkles;
  return <Icon className={className} strokeWidth={2.2} aria-hidden />;
}
