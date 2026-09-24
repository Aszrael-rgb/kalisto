"use client";

import { Check, Palette } from "lucide-react";

import { useTheme, type ColorTheme } from "@/components/theme/theme-provider";

const themes: Array<{ id: ColorTheme; label: string; color: string }> = [
  { id: "system", label: "Sistema", color: "linear-gradient(135deg, #e2e8f0 50%, #0f172a 50%)" },
  { id: "ocean", label: "Océano", color: "#0891b2" },
  { id: "forest", label: "Bosque", color: "#15803d" },
  { id: "amber", label: "Ámbar", color: "#b45309" },
  { id: "coral", label: "Coral", color: "#be123c" },
];

export function ThemePicker() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-picker flex items-center gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 shadow-sm" title="Cambiar paleta de color">
      <Palette aria-hidden="true" className="size-4 text-[var(--theme-muted)]" />
      <span className="sr-only">Paleta de color</span>
      <div className="flex gap-1.5">
        {themes.map((option) => {
          const selected = theme === option.id;
          return (
            <button
              aria-label={`Usar paleta ${option.label}`}
              className={`relative flex size-6 items-center justify-center rounded-full border-2 transition hover:scale-110 ${selected ? "border-[var(--theme-ink)]" : "border-transparent"}`}
              key={option.id}
              onClick={() => setTheme(option.id)}
              style={{ background: option.color }}
              type="button"
            >
              {selected ? <Check aria-hidden="true" className="size-3 text-white drop-shadow" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
