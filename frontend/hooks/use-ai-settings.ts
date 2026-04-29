"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "cortex_ai_settings";

export type AISettings = {
  aiApiKey: string | null;
  aiModel: string | null;
  aiProvider: string | null;
};

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>({
    aiApiKey: null,
    aiModel: "google/gemini-2.5-flash",
    aiProvider: "openai",
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse AI settings", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = (newSettings: Partial<AISettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { settings, updateSettings, isLoaded };
}
