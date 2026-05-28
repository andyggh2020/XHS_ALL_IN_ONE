import { ConfigProvider, theme as antdTheme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type ThemeMode = "dark" | "light";

const ThemeContext = createContext<{ mode: ThemeMode; toggle: () => void }>({
  mode: "dark",
  toggle: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

const shared = {
  colorPrimary: "#1668dc",
  borderRadius: 8,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
};

const darkToken = {
  ...shared,
  colorBgBase: "#08080f",
  colorBgContainer: "#111118",
  colorBgElevated: "#1a1a24",
  colorBorder: "#1e1e2a",
  colorBorderSecondary: "#16161f",
  colorBgSpotlight: "rgba(22,104,220,0.08)",
  colorLink: "#4e8ff7",
  colorSuccess: "#22c55e",
  colorWarning: "#eab308",
  colorError: "#ef4444",
  colorInfo: "#4e8ff7",
  boxShadow: "0 1px 2px rgba(0,0,0,0.5)",
  boxShadowSecondary: "0 8px 32px rgba(0,0,0,0.6)",
  controlOutline: "rgba(22,104,220,0.25)",
};

const lightToken = {
  ...shared,
  colorBgBase: "#f4f4f8",
  colorBgContainer: "#ffffff",
  colorBgElevated: "#ffffff",
  colorBorder: "#e2e2ea",
  colorBorderSecondary: "#eaeaf2",
  colorBgSpotlight: "rgba(22,104,220,0.04)",
  colorLink: "#1668dc",
  colorSuccess: "#22c55e",
  colorWarning: "#eab308",
  colorError: "#ef4444",
  colorInfo: "#1668dc",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  boxShadowSecondary: "0 8px 32px rgba(0,0,0,0.08)",
  controlOutline: "rgba(22,104,220,0.2)",
};

type Props = { children: ReactNode };
export function AppProviders({ children }: Props) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme-mode");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme-mode", mode);
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);
  }, [mode]);

  const toggle = () => setMode((m) => (m === "dark" ? "light" : "dark"));
  const isDark = mode === "dark";

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: isDark ? darkToken : lightToken,
          components: {
            Layout: {
              siderBg: isDark ? "#0a0a0f" : "#ffffff",
              headerBg: isDark ? "rgba(10,10,15,0.8)" : "rgba(255,255,255,0.8)",
              bodyBg: isDark ? "#08080f" : "#f4f4f8",
            },
            Menu: {
              itemBorderRadius: 10,
              itemMarginInline: 8,
              itemMarginBlock: 3,
              ...(isDark ? {
                darkItemBg: "transparent",
                darkSubMenuItemBg: "transparent",
                darkItemSelectedBg: "rgba(22,104,220,0.12)",
                darkItemSelectedColor: "#fff",
                darkItemHoverBg: "rgba(255,255,255,0.04)",
                darkItemColor: "rgba(255,255,255,0.55)",
              } : {
                itemBg: "transparent",
                itemSelectedBg: "rgba(22,104,220,0.06)",
                itemSelectedColor: "#1668dc",
                itemHoverBg: "rgba(0,0,0,0.03)",
                itemColor: "rgba(0,0,0,0.5)",
              }),
            },
            Card: { borderRadius: 16 },
            Table: {
              borderRadius: 16,
              headerBg: isDark ? "#0d0d16" : "#f8f8fb",
              headerColor: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
              borderColor: isDark ? "#16161f" : "#eeeef2",
              rowHoverBg: isDark ? "rgba(22,104,220,0.04)" : "rgba(22,104,220,0.02)",
            },
            Button: { borderRadius: 10, controlHeight: 38 },
            Input: { borderRadius: 10, controlHeight: 42 },
            Select: { borderRadius: 10, controlHeight: 42 },
            Tag: { borderRadius: 6 },
            Modal: { borderRadius: 16 },
            Notification: { borderRadius: 14 },
            Popover: { borderRadius: 12 },
            Tooltip: { borderRadius: 6 },
            Segmented: { borderRadius: 10, itemSelectedBg: isDark ? "#1668dc" : "#ffffff" },
            Dropdown: { borderRadius: 12 },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
