import { contextBridge, ipcRenderer } from "electron";

import {
  ANIVAULT_CONFIG_GET,
  ANIVAULT_CONFIG_GET_ALL,
  ANIVAULT_CONFIG_SET,
} from "./anivault-channels";
import type { AnivaultStoreSchema } from "@/shared/anivault-types";

export function exposeAnivaultContext() {
  contextBridge.exposeInMainWorld("anivault", {
    getConfig: <K extends keyof AnivaultStoreSchema>(key: K) =>
      ipcRenderer.invoke(ANIVAULT_CONFIG_GET, key) as Promise<AnivaultStoreSchema[K]>,
    getAllConfig: () =>
      ipcRenderer.invoke(ANIVAULT_CONFIG_GET_ALL) as Promise<AnivaultStoreSchema>,
    setConfig: (partial: Partial<AnivaultStoreSchema>) =>
      ipcRenderer.invoke(ANIVAULT_CONFIG_SET, partial) as Promise<boolean>,
  });
}
