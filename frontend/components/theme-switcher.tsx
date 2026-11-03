"use client";

import { Check, Palette } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ThemeOption = {
  id: string;
  name: string;
  description: string;
  lightBg: string;
  darkBg: string;
  primaryColor: string;
  accentColor: string;
};

const themes: ThemeOption[] = [
  {
    id: "midnight",
    name: "Midnight Slate",
    description: "Futuristic neon workspace with electric indigo and teal accents.",
    lightBg: "bg-[#faf9f7]",
    darkBg: "bg-[#13141c]",
    primaryColor: "bg-[#6366f1]",
    accentColor: "bg-[#0ea5e9]",
  },
  {
    id: "forest",
    name: "Forest Emerald",
    description: "Calming botanical study space with organic green and amber gold.",
    lightBg: "bg-[#f4f7f4]",
    darkBg: "bg-[#121814]",
    primaryColor: "bg-[#2d6a4f]",
    accentColor: "bg-[#f59e0b]",
  },
  {
    id: "sunset",
    name: "Sunset Amber",
    description: "Warm, cozy industrial workspace with rust terracotta and orange highlights.",
    lightBg: "bg-[#faf7f2]",
    darkBg: "bg-[#120f0d]",
    primaryColor: "bg-[#c2410c]",
    accentColor: "bg-[#ea580c]",
  },
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<string>("midnight");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem("app-theme") || "midnight";
    setCurrentTheme(stored);
  }, []);

  const selectTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("app-theme", themeId);
      document.documentElement.setAttribute("data-theme", themeId);
    }
  };

  if (!mounted) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-border/20 bg-muted/20 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {themes.map((theme) => {
          const isSelected = currentTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => selectTheme(theme.id)}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-4 text-left transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-primary/40 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border/60 hover:bg-muted/10"
              )}
            >
              {/* Mini Preview Bar */}
              <div className="flex items-center justify-between w-full mb-3">
                <span className="text-sm font-semibold text-foreground">
                  {theme.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center -space-x-1.5">
                    <span
                      className={cn(
                        "size-3.5 rounded-full border border-white/20 shadow-sm",
                        theme.primaryColor
                      )}
                    />
                    <span
                      className={cn(
                        "size-3.5 rounded-full border border-white/20 shadow-sm",
                        theme.accentColor
                      )}
                    />
                  </div>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Check className="size-3.5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Theme Preview Box */}
              <div className="relative w-full h-12 rounded-lg overflow-hidden border border-border/30 bg-muted/40 mb-3">
                <div className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-center p-2">
                  <div className={cn("w-full h-full rounded-md shadow-xs flex items-center justify-center border border-border/10", theme.lightBg)}>
                    <span className="text-[9px] font-bold text-slate-800">Aa</span>
                  </div>
                </div>
                <div className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-center p-2 bg-neutral-950">
                  <div className={cn("w-full h-full rounded-md shadow-xs flex items-center justify-center border border-white/5", theme.darkBg)}>
                    <span className="text-[9px] font-bold text-slate-100">Aa</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground/80 leading-relaxed truncate">
                {theme.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
