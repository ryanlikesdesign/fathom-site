"use client";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      className="rounded-[var(--radius-btn)] border px-3 py-2 text-sm transition-colors"
      style={{ transitionDuration: "var(--dur)" }}
    >
      <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
    </button>
  );
}
