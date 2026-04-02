import { AV_TOAST_EVENT, type AvToastDetail } from "@/renderer/lib/av-toast";
import React, { useEffect, useState } from "react";

/**
 * Renders transient status messages (copy feedback, etc.) without a toast library.
 */
export function AvToastHost() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const onToast = (e: Event) => {
      const ce = e as CustomEvent<AvToastDetail>;
      const msg = ce.detail?.message?.trim();
      if (!msg) return;
      const ms = ce.detail?.durationMs ?? 2600;
      setToast(msg);
      window.setTimeout(() => setToast(null), ms);
    };
    window.addEventListener(AV_TOAST_EVENT, onToast);
    return () => window.removeEventListener(AV_TOAST_EVENT, onToast);
  }, []);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-1/2 z-[100000] max-w-[min(90vw,360px)] -translate-x-1/2 rounded-xl border border-[var(--av-border)] bg-[var(--av-surface)] px-4 py-2.5 text-center text-sm text-[var(--av-text)] shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {toast}
    </div>
  );
}
