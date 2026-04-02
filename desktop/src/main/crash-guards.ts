/**
 * Main-process diagnostics: log fatal async/sync failures instead of failing silently.
 * Keep handlers tiny — no heavy work here (avoids re-entrancy during error paths).
 */
import { app } from "electron";

export function registerMainCrashGuards(): void {
  process.on("uncaughtException", (err) => {
    console.error("[anivault-main] uncaughtException", err);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[anivault-main] unhandledRejection", reason);
  });

  app.on("render-process-gone", (_event, contents, details) => {
    console.error("[anivault-main] render-process-gone", details.reason, details.exitCode, contents.getURL());
  });

  app.on("child-process-gone", (_event, details) => {
    console.error("[anivault-main] child-process-gone", details.type, details.reason, details.exitCode);
  });
}
