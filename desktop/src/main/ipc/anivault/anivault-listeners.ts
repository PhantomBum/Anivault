import { ipcMain } from "electron";

import {
  ANIVAULT_CONFIG_GET,
  ANIVAULT_CONFIG_GET_ALL,
  ANIVAULT_CONFIG_SET,
} from "./anivault-channels";
import type { AnivaultStoreSchema } from "@/shared/anivault-types";

import { anivaultStore } from "./anivault-store";

export function addAnivaultListeners() {
  ipcMain.handle(ANIVAULT_CONFIG_GET_ALL, () => {
    return anivaultStore.store as AnivaultStoreSchema;
  });

  ipcMain.handle(ANIVAULT_CONFIG_GET, (_e, key: keyof AnivaultStoreSchema) => {
    // electron-store is typed Store<AnivaultStoreSchema>; ESLint still flags .get as any in this toolchain
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return anivaultStore.get(key) as AnivaultStoreSchema[typeof key];
  });

  ipcMain.handle(
    ANIVAULT_CONFIG_SET,
    (_e, payload: Partial<AnivaultStoreSchema>) => {
      (Object.keys(payload) as (keyof AnivaultStoreSchema)[]).forEach((k) => {
        const v = payload[k];
        if (v !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          anivaultStore.set(k, v);
        }
      });
      return true;
    }
  );
}
