"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start at "light" so the server-rendered markup and the client's first
  // render agree (no hydration mismatch). The real theme is applied to <html>
  // before paint by the inline anti-flash script in the document head.
  const [theme, setTheme] = useState<Theme>("light");

  // After hydration, adopt whatever the anti-flash script already put on <html>.
  useEffect(() => {
    const applied: Theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with client-only DOM state post-hydration
    setTheme(applied);
  }, []);

  // Drive the DOM class and persistence from the toggle directly, so we never
  // clobber the pre-paint theme on mount.
  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage unavailable (private mode, etc.) — theme still applies for the session */
    }
    setTheme(next);
  }, []);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
