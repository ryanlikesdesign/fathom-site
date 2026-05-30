import type { ReactNode } from "react";

export function Section({
  children,
  className = "",
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section aria-labelledby={labelledBy} className={`px-6 ${className}`} style={{ paddingTop: "var(--section-y)", paddingBottom: "var(--section-y)" }}>
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}
