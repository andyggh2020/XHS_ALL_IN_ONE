import { useThemeMode } from "../app/providers";

export function useThemeColors() {
  const { mode } = useThemeMode();
  const isDark = mode === "dark";

  return {
    isDark,
    cardBg: isDark ? "#1f1f1f" : "#ffffff",
    cardBg2: isDark ? "#1a1a1a" : "#fafafa",
    cardBg3: isDark ? "#141414" : "#f5f5f5",
    cardBg4: isDark ? "#262626" : "#fafafa",
    cardBorder: isDark ? "#303030" : "#e8e8e8",
    cardBorder2: isDark ? "#262626" : "#f0f0f0",
    textPrimary: isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.88)",
    textSecondary: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)",
    textTertiary: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
    textMuted: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
    textMuted2: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)",
  } as const;
}
