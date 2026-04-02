import { applyUiDensityToShell } from "@/renderer/helpers/ui-density";
import type { AnivaultStoreSchema } from "@/shared/anivault-types";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AnivaultConfigContextValue = {
  config: AnivaultStoreSchema | null;
  refresh: () => Promise<void>;
};

const AnivaultConfigContext = createContext<AnivaultConfigContextValue | null>(null);

export function AnivaultConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AnivaultStoreSchema | null>(null);

  const refresh = useCallback(async () => {
    if (!window.anivault) return;
    const c = await window.anivault.getAllConfig();
    setConfig(c);
    applyUiDensityToShell(c.uiDensity);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ config, refresh }), [config, refresh]);

  return (
    <AnivaultConfigContext.Provider value={value}>{children}</AnivaultConfigContext.Provider>
  );
}

export function useAnivaultConfig(): AnivaultConfigContextValue {
  const ctx = useContext(AnivaultConfigContext);
  if (!ctx) {
    throw new Error("useAnivaultConfig must be used within AnivaultConfigProvider");
  }
  return ctx;
}
