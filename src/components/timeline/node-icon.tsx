"use client";

import { Sunrise, Coffee, UtensilsCrossed, Dumbbell, Soup, Moon } from "lucide-react";
import type { NodeKey } from "@/lib/schedule/engine";

const ICONS: Record<NodeKey, typeof Sunrise> = {
  wake: Sunrise,
  breakfast: Coffee,
  lunch: UtensilsCrossed,
  workout: Dumbbell,
  dinner: Soup,
  bedtime: Moon,
};

export function NodeIcon({ nodeKey, className }: { nodeKey: NodeKey; className?: string }) {
  const Icon = ICONS[nodeKey];
  return <Icon className={className} strokeWidth={2.2} aria-hidden />;
}
