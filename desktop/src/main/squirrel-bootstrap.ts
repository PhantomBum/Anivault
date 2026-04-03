/**
 * Squirrel.Windows runs the app with `--squirrel-install`, `--squirrel-updated`, etc.
 * Import this module before any other main-process side effects.
 */
import { app } from "electron";

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const squirrelHandled = require("electron-squirrel-startup") as boolean;

if (squirrelHandled) {
  app.quit();
}
