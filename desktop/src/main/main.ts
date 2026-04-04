import "@/main/squirrel-bootstrap";

import { BrowserWindow, app, nativeImage, net, protocol } from "electron";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { registerMainCrashGuards } from "@/main/crash-guards";
import { setupAutoUpdater } from "@/main/auto-updater-setup";
import { registerListeners, unregisterListeners } from "@/main/ipc/listeners";
import { startStreamProxy } from "@/main/stream-proxy";
import { APP_DISPLAY_NAME } from "@/shared/app-brand";

/** Lets the packaged renderer load over `anivault://` so module/CSS fetches aren’t tied to brittle `file://` behavior. */
protocol.registerSchemesAsPrivileged([
  {
    scheme: "anivault",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

registerMainCrashGuards();

const PRODUCT_NAME = APP_DISPLAY_NAME;

/**
 * Taskbar / window icon. Packaged: `public` is inside `app.asar`.
 * Dev: `public` is two levels up from `.vite/build`.
 */
function resolveWindowIcon(): Electron.NativeImage | undefined {
  const candidates: string[] = [];
  if (app.isPackaged) {
    const appPath = app.getAppPath();
    // Prefer rounded assets; Vite copies `public/` into the renderer outDir.
    candidates.push(
      path.join(__dirname, "..", "renderer", "main_window", "icon-rounded.ico"),
      path.join(__dirname, "..", "renderer", "main_window", "icon-rounded.png"),
      path.join(__dirname, "..", "renderer", "main_window", "icon.ico"),
      path.join(__dirname, "..", "renderer", "main_window", "icon.png"),
      path.join(appPath, "renderer", "main_window", "icon-rounded.ico"),
      path.join(appPath, "renderer", "main_window", "icon-rounded.png"),
      path.join(appPath, "renderer", "main_window", "icon.ico"),
      path.join(appPath, "renderer", "main_window", "icon.png"),
      path.join(appPath, "public", "icon-rounded.ico"),
      path.join(appPath, "public", "icon-rounded.png"),
      path.join(appPath, "public", "icon.ico"),
      path.join(appPath, "public", "icon.png"),
      path.join(process.resourcesPath, "public", "icon-rounded.ico"),
      path.join(process.resourcesPath, "public", "icon-rounded.png")
    );
  } else {
    candidates.push(
      path.join(__dirname, "../../public/icon-rounded.ico"),
      path.join(__dirname, "../../public/icon-rounded.png"),
      path.join(__dirname, "../../public/icon.ico"),
      path.join(__dirname, "../../public/icon.png")
    );
  }
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const img = nativeImage.createFromPath(p);
        if (!img.isEmpty()) return img;
      } catch {
        /* ignore */
      }
    }
  }
  return undefined;
}

const createWindow = () => {
  const icon = resolveWindowIcon();
  const mainWindow = new BrowserWindow({
    title: PRODUCT_NAME,
    ...(icon ? { icon } : {}),
    width: 1320,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      /** Must stay `false` with `contextIsolation: true` — `true` breaks the renderer in recent Electron (blank window). */
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      /**
       * Packaged UI is loaded from `file://`; disabling avoids edge cases where the SPA bundle fails to run.
       * Remote content is not loaded in the shell; APIs go through preload IPC.
       */
      webSecurity: !app.isPackaged,
      devTools: !app.isPackaged,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition: process.platform === "darwin" ? { x: 16, y: 16 } : undefined,
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else if (app.isPackaged) {
    void mainWindow.loadURL("anivault:///index.html");
  } else {
    const indexHtml = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
    void mainWindow.loadURL(pathToFileURL(indexHtml).href);
  }

  mainWindow.webContents.on("did-fail-load", (_event, code, desc, url) => {
    // eslint-disable-next-line no-console
    console.error("[main] renderer did-fail-load", { code, desc, url });
  });

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

app.on("ready", () => {
  if (app.isPackaged) {
    const rendererRoot = path.join(__dirname, "..", "renderer", MAIN_WINDOW_VITE_NAME);
    const rootNorm = path.normalize(rendererRoot);
    protocol.handle("anivault", (request) => {
      const u = new URL(request.url);
      let pathname = u.pathname || "/";
      if (pathname === "/" || pathname === "") pathname = "/index.html";
      const rel = pathname.replace(/^\/+/, "");
      if (!rel || rel.includes("..")) {
        return new Response(null, { status: 403 });
      }
      const filePath = path.normalize(path.join(rootNorm, rel));
      const relCheck = path.relative(rootNorm, filePath);
      if (relCheck.startsWith("..") || path.isAbsolute(relCheck)) {
        return new Response(null, { status: 403 });
      }
      return net.fetch(pathToFileURL(filePath).href);
    });
  }

  app.setName(PRODUCT_NAME);
  if (process.platform === "win32") {
    // Match NSIS / electron-builder `appId` in forge.config.ts (taskbar + jump list).
    app.setAppUserModelId("com.anivault.unvaulted");
  }
  if (process.platform === "darwin" && app.dock) {
    const dockIcon = resolveWindowIcon();
    if (dockIcon) {
      app.dock.setIcon(dockIcon);
    }
  }
  setupAutoUpdater();
  registerListeners();
  void startStreamProxy().then(() => {
    createWindow();
  });
});

app.on("window-all-closed", () => {
  unregisterListeners();
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
