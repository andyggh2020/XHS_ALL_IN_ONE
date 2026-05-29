import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { ToastProvider, setGlobalToast, useToast } from "../components/ui/toast";

type ThemeMode = "dark" | "light";

const ThemeContext = createContext<{ mode: ThemeMode; toggle: () => void }>({
  mode: "dark",
  toggle: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

type Props = { children: ReactNode };

function ThemeInner({ children }: Props) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme-mode");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme-mode", mode);
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [mode]);

  const toggle = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function AppProviders({ children }: Props) {
  return (
    <ThemeInner>
      <ToastProvider>
        <ToastBootstrap />
        {children}
      </ToastProvider>
    </ThemeInner>
  );
}

/** 挂载全局 toast 实例到 message 对象，供 api.ts 使用 */
function ToastBootstrap() {
  const toastInstance = useToast();
  useEffect(() => {
    setGlobalToast(toastInstance);
  }, [toastInstance]);
  return null;
}
