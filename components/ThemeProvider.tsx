"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start at "dark" to match the server-rendered default (:root = dark), so
  // hydration agrees. The real theme is applied to <html data-theme> before
  // paint by the inline anti-flash script in the document head.
  const [theme, setTheme] = useState<Theme>("dark");

  // After hydration, adopt whatever the anti-flash script put on <html>.
  useEffect(() => {
    const applied = document.documentElement.getAttribute("data-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with client-only DOM state post-hydration
    setTheme(applied === "light" ? "light" : "dark");
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("fathom-theme", next);
    } catch {
      /* storage unavailable (private mode, etc.) — theme still applies for the session */
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "dark" ? "#0e1013" : "#f2ede4");
    setTheme(next);
  }, []);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
