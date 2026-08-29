"use client";

import { CircleCheckBig } from "lucide-react";

export function HabitSkeletonList() {
  return (
    <div className="mt-2 flex flex-col gap-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[116px] animate-pulse rounded-[24px] bg-white/40" />
      ))}
    </div>
  );
}

export function HabitSignInCard({
  onSignIn,
  label,
  cta,
}: {
  onSignIn: () => void;
  label: string;
  cta: string;
}) {
  return (
    <div
      className="mt-4 flex flex-col items-center gap-4 rounded-[24px] border border-[rgba(255,255,255,.72)] bg-[rgba(255,253,248,.82)] px-6 py-10 text-center shadow-[var(--cc-shadow-sm)] backdrop-blur-xl"
      data-el="habits-signin"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/12 text-primary">
        <CircleCheckBig className="h-6 w-6" />
      </span>
      <p className="text-sm text-muted-foreground">{label}</p>
      <button
        type="button"
        onClick={onSignIn}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition active:scale-95"
      >
        {cta}
      </button>
    </div>
  );
}

export function HabitEmptyCard({
  onAdd,
  text,
  cta,
}: {
  onAdd: () => void;
  text: string;
  cta: string;
}) {
  return (
    <div
      className="mt-4 flex flex-col items-center gap-4 rounded-[24px] border border-dashed border-border bg-white/30 px-6 py-10 text-center"
      data-el="habits-empty"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
        <CircleCheckBig className="h-6 w-6" />
      </span>
      <p className="text-sm text-muted-foreground">{text}</p>
      <button
        type="button"
        onClick={onAdd}
        className="rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background transition active:scale-95"
      >
        {cta}
      </button>
    </div>
  );
}
