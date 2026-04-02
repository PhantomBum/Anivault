/* eslint-disable @typescript-eslint/no-unsafe-call -- electron-store get/set are typed loosely in this toolchain */
import { createHash, randomBytes } from "node:crypto";

import { ipcMain } from "electron";

import {
  SECURITY_GET_STATUS,
  SECURITY_SET_GATE,
  SECURITY_UNLOCK,
} from "./security-channels";
import { securityStore, type SecurityStoreSchema } from "./security-store";

function readStore<K extends keyof SecurityStoreSchema>(key: K): SecurityStoreSchema[K] {
  return securityStore.get(key) as SecurityStoreSchema[K];
}

function hashPasscode(salt: string, passcode: string): string {
  return createHash("sha256").update(`${salt}:${passcode}`, "utf8").digest("hex");
}

export type SetGatePayload = {
  enabled: boolean;
  newCode: string;
  currentCode?: string;
};

export type SetGateResult = { ok: true } | { ok: false; error: string };

export function addSecurityListeners() {
  ipcMain.handle(SECURITY_GET_STATUS, () => {
    const gateEnabled = readStore("gateEnabled");
    const passcodeHash = readStore("passcodeHash");
    return {
      enabled: gateEnabled,
      hasPasscode: Boolean(passcodeHash && passcodeHash.length > 0),
    };
  });

  ipcMain.handle(SECURITY_UNLOCK, (_e, code: string) => {
    if (!readStore("gateEnabled")) return true;
    const expected = readStore("passcodeHash");
    const salt = readStore("salt");
    if (!expected || !salt) return false;
    const tryHash = hashPasscode(salt, String(code ?? ""));
    return tryHash === expected;
  });

  ipcMain.handle(SECURITY_SET_GATE, (_e, payload: SetGatePayload): SetGateResult => {
    const { enabled, newCode, currentCode } = payload;
    const trimmed = newCode.trim();
    const hasExisting = Boolean(readStore("passcodeHash") && readStore("salt"));

    if (enabled) {
      /** Allow turning the lock on from Settings; user sets the code on the next startup splash. */
      if (trimmed.length === 0 && !hasExisting) {
        securityStore.set("gateEnabled", true);
        securityStore.set("salt", "");
        securityStore.set("passcodeHash", "");
        return { ok: true };
      }
      if (trimmed.length < 4) {
        return { ok: false, error: "Access code must be at least 4 characters." };
      }
      if (hasExisting) {
        const salt = readStore("salt");
        const expected = readStore("passcodeHash");
        const cur = String(currentCode ?? "");
        if (!salt || !expected || hashPasscode(salt, cur) !== expected) {
          return { ok: false, error: "Current access code is incorrect." };
        }
      }
      const salt = hasExisting ? readStore("salt") : randomBytes(24).toString("hex");
      securityStore.set("salt", salt);
      securityStore.set("passcodeHash", hashPasscode(salt, trimmed));
      securityStore.set("gateEnabled", true);
      return { ok: true };
    }

    securityStore.set("gateEnabled", false);
    securityStore.set("salt", "");
    securityStore.set("passcodeHash", "");
    return { ok: true };
  });
}
