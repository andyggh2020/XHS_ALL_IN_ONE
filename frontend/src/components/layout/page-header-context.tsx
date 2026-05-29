import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type PageHeaderState = {
  title: string;
  description: string;
  actions?: ReactNode;
};

type PageHeaderContextType = {
  config: PageHeaderState;
  setConfig: (config: PageHeaderState) => void;
};

const PageHeaderContext = createContext<PageHeaderContextType>({
  config: { title: "", description: "" },
  setConfig: () => {},
});

export function usePageHeader() {
  return useContext(PageHeaderContext);
}

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PageHeaderState>({ title: "", description: "" });
  return (
    <PageHeaderContext.Provider value={{ config, setConfig }}>
      {children}
    </PageHeaderContext.Provider>
  );
}
