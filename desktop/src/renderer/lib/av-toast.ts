/** Lightweight toast bus — `AvToastHost` in the shell listens for these events. */
export const AV_TOAST_EVENT = "anivault-toast";

export type AvToastDetail = { message: string; durationMs?: number };

export function showToast(message: string, durationMs = 2600): void {
  window.dispatchEvent(
    new CustomEvent<AvToastDetail>(AV_TOAST_EVENT, {
      detail: { message, durationMs },
    })
  );
}
