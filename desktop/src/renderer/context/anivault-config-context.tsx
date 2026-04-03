import { applyShellAppearance } from "@/renderer/helpers/shell-appearance";
import { applyUiDensityToShell } from "@/renderer/helpers/ui-density";
import { invalidateTelemetryCache } from "@/renderer/lib/telemetry";
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
    invalidateTelemetryCache();
    applyUiDensityToShell(c.uiDensity);
    applyShellAppearance({
      chromaticEmphasis: c.chromaticEmphasis,
      shellPreset: c.shellPreset,
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (config == null) return;
    try {
      void getWindowControls().setAlwaysOnTop(config.windowAlwaysOnTop);
    } catch {
      /* ignore — non-Electron test environments */
    }
  }, [config, config.windowAlwaysOnTop]);

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
