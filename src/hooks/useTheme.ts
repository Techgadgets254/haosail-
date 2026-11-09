import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "theme";
const BACKUP_STORAGE_KEY = "tgk_active_theme";

/**
 * Custom hook to detect operating system theme preference using window.matchMedia('(prefers-color-scheme: dark)')
 * and persist the user's selected theme in localStorage across page refreshes.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(BACKUP_STORAGE_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") {
        return saved as ThemeMode;
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(BACKUP_STORAGE_KEY);
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  const applyTheme = useCallback((targetTheme: ThemeMode) => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = targetTheme === "dark" || (targetTheme === "system" && mediaQuery.matches);
    const mode: "light" | "dark" = isDark ? "dark" : "light";

    setResolvedTheme(mode);

    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light-theme");
      root.style.colorScheme = "dark";
      root.setAttribute("data-theme", "dark");
      root.style.setProperty("--bg-primary", "#0B0F19");
      root.style.setProperty("--bg-surface", "#111827");
      root.style.setProperty("--bg-surface-elevated", "#1F2937");
      root.style.setProperty("--bg-header", "rgba(17, 24, 39, 0.85)");
      root.style.setProperty("--text-primary", "#F8FAFC");
      root.style.setProperty("--text-secondary", "#CBD5E1");
      root.style.setProperty("--text-muted", "#94A3B8");
      root.style.setProperty("--border-subtle", "rgba(51, 65, 85, 0.8)");
      root.style.setProperty("--border-card", "rgba(51, 65, 85, 0.85)");
      root.style.setProperty("--brand-primary", "#3B82F6");
      root.style.setProperty("--brand-hover", "#60A5FA");
      root.style.setProperty("--brand-surface", "rgba(59, 130, 246, 0.15)");
      root.style.setProperty("--card-shadow", "0 4px 20px -2px rgba(0, 0, 0, 0.5)");
    } else {
      root.classList.remove("dark");
      root.classList.add("light-theme");
      root.style.colorScheme = "light";
      root.setAttribute("data-theme", "light");
      root.style.setProperty("--bg-primary", "#F8FAFC");
      root.style.setProperty("--bg-surface", "#FFFFFF");
      root.style.setProperty("--bg-surface-elevated", "#F1F5F9");
      root.style.setProperty("--bg-header", "rgba(255, 255, 255, 0.85)");
      root.style.setProperty("--text-primary", "#0F172A");
      root.style.setProperty("--text-secondary", "#475569");
      root.style.setProperty("--text-muted", "#64748B");
      root.style.setProperty("--border-subtle", "rgba(226, 232, 240, 0.8)");
      root.style.setProperty("--border-card", "rgba(226, 232, 240, 0.85)");
      root.style.setProperty("--brand-primary", "#0055B8");
      root.style.setProperty("--brand-hover", "#004494");
      root.style.setProperty("--brand-surface", "rgba(0, 85, 184, 0.08)");
      root.style.setProperty("--card-shadow", "0 1px 3px 0 rgba(0, 0, 0, 0.02), 0 1px 2px -1px rgba(0, 0, 0, 0.02)");
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      localStorage.setItem(BACKUP_STORAGE_KEY, theme);
    } catch (e) {
      console.warn("Failed to persist theme preference:", e);
    }

    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleMediaChange = () => {
        if (theme === "system") {
          applyTheme("system");
        }
      };

      mediaQuery.addEventListener("change", handleMediaChange);
      return () => mediaQuery.removeEventListener("change", handleMediaChange);
    }
  }, [theme, applyTheme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      localStorage.setItem(BACKUP_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn("Failed to save theme to localStorage:", e);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: ThemeMode = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
        localStorage.setItem(BACKUP_STORAGE_KEY, next);
      } catch (e) {}
      return next;
    });
  }, []);

  return {
    theme,
    resolvedTheme,
    isDark: resolvedTheme === "dark",
    setTheme,
    toggleTheme
  };
}
