/**
 * Typed bridge to window.windowControls (exposed via preload).
 */
export interface WindowControlsContext {
  minimize: () => Promise<void>;
  close: () => Promise<void>;
  toggleMaximize: () => Promise<boolean>;
  isMaximized: () => Promise<boolean>;
  /** Keeps the main BrowserWindow above normal windows (playback / mini-bar multitasking). */
  setAlwaysOnTop: (flag: boolean) => Promise<void>;
}

export function getWindowControls(): WindowControlsContext {
  return (window as Window & { windowControls: WindowControlsContext }).windowControls;
}

