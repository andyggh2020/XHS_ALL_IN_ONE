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

const sharedToken = {
  colorPrimary: "#1668dc",
  borderRadius: 8,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
};

const darkToken = {
  ...sharedToken,
  colorBgBase: "#0f0f0f",
  colorBgContainer: "#1a1a1a",
  colorBgElevated: "#242424",
  colorBorder: "#2a2a2a",
  colorBorderSecondary: "#222222",
  colorBgSpotlight: "rgba(22,104,220,0.08)",
  colorLink: "#4e8ff7",
  colorSuccess: "#22c55e",
  colorWarning: "#eab308",
  colorError: "#ef4444",
  colorInfo: "#4e8ff7",
  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  boxShadowSecondary: "0 4px 12px rgba(0,0,0,0.4)",
  controlOutline: "rgba(22,104,220,0.25)",
};

const lightToken = {
  ...sharedToken,
  colorBgBase: "#f8f9fa",
  colorBgContainer: "#ffffff",
  colorBgElevated: "#ffffff",
  colorBorder: "#e8e8e8",
  colorBorderSecondary: "#f0f0f0",
  colorBgSpotlight: "rgba(22,104,220,0.04)",
  colorLink: "#1668dc",
  colorSuccess: "#22c55e",
  colorWarning: "#eab308",
  colorError: "#ef4444",
  colorInfo: "#1668dc",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  boxShadowSecondary: "0 4px 12px rgba(0,0,0,0.08)",
  controlOutline: "rgba(22,104,220,0.2)",
};

type AppProvidersProps = { children: ReactNode };

export function AppProviders({ children }: AppProvidersProps) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme-mode");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme-mode", mode);
    document.body.style.background = mode === "dark" ? "#0f0f0f" : "#f8f9fa";
    document.body.style.color = mode === "dark" ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.88)";
  }, [mode]);

  const toggle = () => setMode((m) => (m === "dark" ? "light" : "dark"));
  const isDark = mode === "dark";

  const components = {
    Layout: {
      siderBg: isDark ? "#0f0f0f" : "#ffffff",
      headerBg: isDark ? "rgba(15,15,15,0.8)" : "rgba(255,255,255,0.8)",
      bodyBg: isDark ? "#0f0f0f" : "#f8f9fa",
    },
    Menu: {
      itemBorderRadius: 8,
      itemMarginInline: 6,
      subMenuItemBg: "transparent",
      ...(isDark ? {
        darkItemBg: "transparent",
        darkSubMenuItemBg: "transparent",
        darkItemSelectedBg: "rgba(22,104,220,0.12)",
        darkItemSelectedColor: "#4e8ff7",
        darkItemHoverBg: "rgba(255,255,255,0.04)",
        darkItemColor: "rgba(255,255,255,0.75)",
      } : {
        itemBg: "transparent",
        itemSelectedBg: "rgba(22,104,220,0.06)",
        itemSelectedColor: "#1668dc",
        itemHoverBg: "rgba(0,0,0,0.03)",
        itemColor: "rgba(0,0,0,0.65)",
      }),
    },
    Card: {
      borderRadius: 12,
      colorBgContainer: isDark ? "#1a1a1a" : "#ffffff",
    },
    Table: {
      borderRadius: 12,
      headerBg: isDark ? "#1a1a1a" : "#fafafa",
      headerColor: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)",
      borderColor: isDark ? "#222222" : "#f0f0f0",
      rowHoverBg: isDark ? "rgba(22,104,220,0.04)" : "rgba(22,104,220,0.02)",
    },
    Button: {
      borderRadius: 8,
      primaryShadow: "0 2px 8px rgba(22,104,220,0.25)",
      controlHeight: 36,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Tag: {
      borderRadius: 6,
    },
    Modal: {
      borderRadius: 12,
    },
    Notification: {
      borderRadius: 12,
    },
    Popover: {
      borderRadius: 10,
    },
    Tooltip: {
      borderRadius: 6,
    },
    Segmented: {
      borderRadius: 8,
      itemSelectedBg: isDark ? "#1668dc" : "#ffffff",
    },
    Dropdown: {
      borderRadius: 10,
    },
  };

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: isDark ? darkToken : lightToken,
          components,
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
