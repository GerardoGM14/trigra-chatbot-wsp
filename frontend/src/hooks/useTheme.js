// Theme state: single source of truth for the active palette.
// Persists the choice to localStorage and applies CSS vars on every change.

import { useState, useEffect } from "react";
import { applyTheme, THEMES } from "../lib/themes.js";

const STORAGE_KEY = "wsp-control.theme";

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && THEMES[saved]) return saved;
    } catch {
      // localStorage unavailable — fall through to default
    }
    return "arena";
  });

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore persistence failures
    }
  }, [theme]);

  return [theme, setTheme];
}
