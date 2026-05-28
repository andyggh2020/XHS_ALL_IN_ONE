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
  colorBgBase: "#0a0a0a",
  colorBgContainer: "#111111",
  colorBgElevated: "#1a1a1a",
  colorBorder: "#1e1e1e",
  colorBorderSecondary: "#181818",
  colorBgSpotlight: "rgba(22,104,220,0.08)",
  colorLink: "#4e8ff7",
  colorSuccess: "#22c55e",
  colorWarning: "#eab308",
  colorError: "#ef4444",
  colorInfo: "#4e8ff7",
  boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
  boxShadowSecondary: "0 4px 16px rgba(0,0,0,0.5)",
  controlOutline: "rgba(22,104,220,0.3)",
};

const lightToken = {
  ...sharedToken,
  colorBgBase: "#f5f5f7",
  colorBgContainer: "#ffffff",
  colorBgElevated: "#ffffff",
  colorBorder: "#e5e5e7",
  colorBorderSecondary: "#eeeef0",
  colorBgSpotlight: "rgba(22,104,220,0.04)",
  colorLink: "#1668dc",
  colorSuccess: "#22c55e",
  colorWarning: "#eab308",
  colorError: "#ef4444",
  colorInfo: "#1668dc",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  boxShadowSecondary: "0 4px 16px rgba(0,0,0,0.06)",
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
    document.body.style.background = mode === "dark" ? "#0a0a0a" : "#f5f5f7";
    document.body.style.color = mode === "dark" ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)";
  }, [mode]);

  const toggle = () => setMode((m) => (m === "dark" ? "light" : "dark"));
  const isDark = mode === "dark";

  const components = {
    Layout: {
      siderBg: isDark ? "#0a0a0a" : "#ffffff",
      headerBg: isDark ? "rgba(10,10,10,0.8)" : "rgba(255,255,255,0.8)",
      bodyBg: isDark ? "#0a0a0a" : "#f5f5f7",
    },
    Menu: {
      itemBorderRadius: 8,
      itemMarginInline: 8,
      itemMarginBlock: 2,
      subMenuItemBg: "transparent",
      ...(isDark ? {
        darkItemBg: "transparent",
        darkSubMenuItemBg: "transparent",
        darkItemSelectedBg: "rgba(22,104,220,0.12)",
        darkItemSelectedColor: "#4e8ff7",
        darkItemHoverBg: "rgba(255,255,255,0.04)",
        darkItemColor: "rgba(255,255,255,0.65)",
      } : {
        itemBg: "transparent",
        itemSelectedBg: "rgba(22,104,220,0.06)",
        itemSelectedColor: "#1668dc",
        itemHoverBg: "rgba(0,0,0,0.03)",
        itemColor: "rgba(0,0,0,0.55)",
      }),
    },
    Card: {
      borderRadius: 16,
      colorBgContainer: isDark ? "#111111" : "#ffffff",
    },
    Table: {
      borderRadius: 16,
      headerBg: isDark ? "#111111" : "#fafafa",
      headerColor: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)",
      borderColor: isDark ? "#1a1a1a" : "#eeeef0",
      rowHoverBg: isDark ? "rgba(22,104,220,0.04)" : "rgba(22,104,220,0.02)",
    },
    Button: {
      borderRadius: 10,
      primaryShadow: "0 2px 8px rgba(22,104,220,0.3)",
      controlHeight: 38,
    },
    Input: {
      borderRadius: 10,
      controlHeight: 42,
    },
    Select: {
      borderRadius: 10,
      controlHeight: 42,
    },
    Tag: {
      borderRadius: 6,
    },
    Modal: {
      borderRadius: 16,
    },
    Notification: {
      borderRadius: 14,
    },
    Popover: {
      borderRadius: 12,
    },
    Tooltip: {
      borderRadius: 6,
    },
    Segmented: {
      borderRadius: 10,
      itemSelectedBg: isDark ? "#1668dc" : "#ffffff",
    },
    Dropdown: {
      borderRadius: 12,
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
