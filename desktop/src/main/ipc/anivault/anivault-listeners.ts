import { ipcMain } from "electron";

import {
  ANIVAULT_CONFIG_GET,
  ANIVAULT_CONFIG_GET_ALL,
  ANIVAULT_CONFIG_SET,
} from "./anivault-channels";
import type { AnivaultStoreSchema } from "@/shared/anivault-types";

import { anivaultDefaults, anivaultStore } from "./anivault-store";

function normalizeApiBaseUrl(raw: string | undefined): string {
  const t = typeof raw === "string" ? raw.trim() : "";
  return t.length > 0 ? t : anivaultDefaults.apiBaseUrl;
}

export function addAnivaultListeners() {
  ipcMain.handle(ANIVAULT_CONFIG_GET_ALL, () => {
    const stored = anivaultStore.store as Partial<AnivaultStoreSchema>;
    if (typeof stored.apiBaseUrl === "string" && !stored.apiBaseUrl.trim()) {
      // Repair bad saves (empty string overrides electron-store defaults and breaks fetch)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      anivaultStore.set("apiBaseUrl", anivaultDefaults.apiBaseUrl);
    }
    const merged = { ...anivaultDefaults, ...anivaultStore.store } as AnivaultStoreSchema;
    merged.apiBaseUrl = normalizeApiBaseUrl(merged.apiBaseUrl);
    return merged;
  });

  ipcMain.handle(ANIVAULT_CONFIG_GET, (_e, key: keyof AnivaultStoreSchema) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const v = anivaultStore.get(key) as AnivaultStoreSchema[typeof key];
    if (key === "apiBaseUrl") {
      return normalizeApiBaseUrl(v as string | undefined) as AnivaultStoreSchema[typeof key];
    }
    return v;
  });

  ipcMain.handle(
    ANIVAULT_CONFIG_SET,
    (_e, payload: Partial<AnivaultStoreSchema>) => {
      (Object.keys(payload) as (keyof AnivaultStoreSchema)[]).forEach((k) => {
        const v = payload[k];
        if (v !== undefined) {
          if (k === "apiBaseUrl" && typeof v === "string") {
            const next = normalizeApiBaseUrl(v);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            anivaultStore.set(k, next);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            anivaultStore.set(k, v);
          }
        }
      });
      return true;
    }
  );
}
