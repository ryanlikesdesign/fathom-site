import type { JSX, ReactNode } from "react";

type Register = "base" | "lift" | "float" | "crest" | "summit" | "peak";

const opacity: Record<Register, number> = {
  base: 0.9, lift: 0.8, float: 0.72, crest: 0.65, summit: 0.5, peak: 0.38,
};
const blur: Record<Register, number> = {
  base: 4, lift: 8, float: 12, crest: 16, summit: 20, peak: 28,
};
const grain: Record<Register, number> = {
  base: 0.032, lift: 0.025, float: 0.018, crest: 0.012, summit: 0.008, peak: 0.005,
};

const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Surface({
  register = "lift",
  as: Tag = "div",
  className = "",
  children,
}: {
  register?: Register;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      data-register={register}
      className={`relative overflow-hidden rounded-[var(--radius-card)] border ${className}`}
      style={{
        background: `rgba(var(--glass) / ${opacity[register]})`,
        backdropFilter: `blur(${blur[register]}px)`,
        WebkitBackdropFilter: `blur(${blur[register]}px)`,
        boxShadow:
          "0 2px 6px rgba(var(--sh) / 0.08), 0 6px 20px rgba(var(--sh) / 0.06)",
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: GRAIN_URL,
          opacity: grain[register],
          mixBlendMode: "overlay",
        }}
      />
      <span className="relative" data-register={register}>{children}</span>
    </Tag>
  );
}
