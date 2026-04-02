import { contextBridge, ipcRenderer } from "electron";

import { SECURITY_GET_STATUS, SECURITY_SET_GATE, SECURITY_UNLOCK } from "./security-channels";

export function exposeSecurityContext() {
  contextBridge.exposeInMainWorld("security", {
    getStatus: () =>
      ipcRenderer.invoke(SECURITY_GET_STATUS) as Promise<{
        enabled: boolean;
        hasPasscode: boolean;
      }>,
    unlock: (code: string) => ipcRenderer.invoke(SECURITY_UNLOCK, code) as Promise<boolean>,
    setGate: (payload: {
      enabled: boolean;
      newCode: string;
      currentCode?: string;
    }) => ipcRenderer.invoke(SECURITY_SET_GATE, payload) as Promise<
      { ok: true } | { ok: false; error: string }
    >,
  });
}
