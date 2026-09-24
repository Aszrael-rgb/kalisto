"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

export type ColorTheme = "system" | "ocean" | "forest" | "amber" | "coral";

type ThemeContextValue = {
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): ColorTheme {
  const storedTheme = window.localStorage.getItem("kalisto-color-theme") as ColorTheme | null;
  return storedTheme && ["system", "ocean", "forest", "amber", "coral"].includes(storedTheme)
    ? storedTheme
    : "system";
}

function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("kalisto-theme-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("kalisto-theme-change", callback);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getStoredTheme, (): ColorTheme => "system");

  useEffect(() => {
    document.documentElement.dataset.colorTheme = theme;
  }, [theme]);

  function setTheme(nextTheme: ColorTheme) {
    window.localStorage.setItem("kalisto-color-theme", nextTheme);
    window.dispatchEvent(new Event("kalisto-theme-change"));
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme debe utilizarse dentro de ThemeProvider.");
  }

  return context;
}
