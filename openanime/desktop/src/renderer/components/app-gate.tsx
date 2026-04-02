import { AvLoadingBar } from "@/renderer/components/av-loading-bar";
import { BrandMark } from "@/renderer/components/brand-mark";
import { cn } from "@/renderer/lib/utils";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";

const SESSION_KEY = "anivault-gate-ok";

type GateMode = "init" | "auth" | "leave" | "main";
type AuthView = "setup" | "unlock" | "change";

/**
 * Full-screen loading splash; access code (when enabled) appears here only — not in Settings.
 */
export function AppGate({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<GateMode>("init");
  const [authView, setAuthView] = useState<AuthView>("unlock");
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [code2, setCode2] = useState("");
  const [currentCode, setCurrentCode] = useState("");
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goToApp = useCallback(() => {
    setMode("leave");
    leaveTimerRef.current = setTimeout(() => {
      setMode("main");
      leaveTimerRef.current = null;
    }, 520);
  }, []);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const minSplash = new Promise<void>((r) => setTimeout(r, 1280));
      if (typeof window.security === "undefined") {
        await minSplash;
        if (!cancelled) goToApp();
        return;
      }
      const st = await window.security.getStatus();
      await minSplash;
      if (cancelled) return;
      if (!st.enabled) {
        goToApp();
        return;
      }
      if (!st.hasPasscode) {
        setAuthView("setup");
        setMode("auth");
        return;
      }
      if (sessionStorage.getItem(SESSION_KEY) === "1") {
        goToApp();
        return;
      }
      setAuthView("unlock");
      setMode("auth");
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [goToApp]);

  const onUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!window.security) return;
    const ok = await window.security.unlock(code);
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setCode("");
      goToApp();
    } else {
      setError("Incorrect access code.");
    }
  };

  const onSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!window.security) return;
    if (code !== code2) {
      setError("Codes do not match.");
      return;
    }
    const res = await window.security.setGate({ enabled: true, newCode: code });
    if (res.ok) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setCode("");
      setCode2("");
      goToApp();
    } else {
      setError(String(res.error));
    }
  };

  const onChangeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!window.security) return;
    if (code !== code2) {
      setError("New codes do not match.");
      return;
    }
    const res = await window.security.setGate({
      enabled: true,
      newCode: code,
      currentCode: currentCode,
    });
    if (res.ok) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setCode("");
      setCode2("");
      setCurrentCode("");
      setAuthView("unlock");
      goToApp();
    } else {
      setError(String(res.error));
    }
  };

  if (mode === "main") {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-500 ease-out">
        {children}
      </div>
    );
  }

  const showAuthCard = mode === "auth";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-black px-6 py-10 text-white",
        "transition-[opacity,transform,filter] duration-500 ease-out motion-safe:transition-all",
        mode === "leave" && "pointer-events-none scale-[0.98] opacity-0 blur-[1px]"
      )}
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-1/4 h-[28rem] w-[28rem] rounded-full bg-white/[0.04] blur-3xl animate-gate-breathe" />
        <div
          className="absolute -right-1/4 bottom-0 h-[28rem] w-[28rem] rounded-full bg-white/[0.03] blur-3xl animate-gate-breathe"
          style={{ animationDelay: "0.6s" }}
        />
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-80 animate-gate-shimmer"
          style={{ backgroundSize: "200% 100%" }}
        />
      </div>

      <div
        className={cn(
          "relative flex w-full max-w-md flex-col items-center gap-8 text-center",
          "animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"
        )}
      >
        <BrandMark
          size="gate"
          className="animate-in zoom-in-95 fade-in duration-500 ease-out shadow-[0_12px_48px_-12px_rgba(0,0,0,0.85)]"
        />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">AniVault</h1>
          {mode === "init" ? (
            <p className="text-sm text-neutral-400">Starting up…</p>
          ) : null}
          {mode === "leave" ? (
            <p className="text-sm text-neutral-500">Launching…</p>
          ) : null}
          {showAuthCard ? (
            <p className="text-sm text-zinc-400">
              {authView === "setup"
                ? "Create your access code on this device."
                : authView === "change"
                  ? "Enter your current code, then choose a new one."
                  : "Enter your access code to continue."}
            </p>
          ) : null}
        </div>

        {mode === "init" && <AvLoadingBar showLabel />}

        {showAuthCard && (
          <div
            className={cn(
              "w-full max-w-sm rounded-3xl border border-white/10 bg-neutral-950/80 p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl",
              "animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500"
            )}
          >
            {authView === "unlock" && (
              <form
                onSubmit={(e) => {
                  void onUnlock(e);
                }}
                className="flex flex-col gap-4 text-left"
              >
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Access code"
                  className="h-12 rounded-2xl border-white/10 bg-black/60 font-mono text-sm text-white placeholder:text-neutral-600"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                {error ? (
                  <p className="text-center text-xs text-red-400" role="alert">
                    {error}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className="h-12 rounded-2xl font-mono text-xs uppercase tracking-wider transition-transform active:scale-[0.98]"
                >
                  Unlock
                </Button>
                <button
                  type="button"
                  className="text-center text-xs text-neutral-500 underline-offset-4 transition-colors hover:text-neutral-300"
                  onClick={() => {
                    setError(null);
                    setCode("");
                    setAuthView("change");
                  }}
                >
                  Change access code
                </button>
              </form>
            )}

            {authView === "setup" && (
              <form
                onSubmit={(e) => {
                  void onSetup(e);
                }}
                className="flex flex-col gap-4 text-left"
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="New code"
                  className="h-12 rounded-2xl border-white/10 bg-black/60 font-mono text-sm text-white placeholder:text-neutral-600"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm code"
                  className="h-12 rounded-2xl border-white/10 bg-black/60 font-mono text-sm text-white placeholder:text-neutral-600"
                  value={code2}
                  onChange={(e) => setCode2(e.target.value)}
                />
                {error ? (
                  <p className="text-center text-xs text-red-400" role="alert">
                    {error}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className="h-12 rounded-2xl font-mono text-xs uppercase tracking-wider transition-transform active:scale-[0.98]"
                >
                  Save and continue
                </Button>
                <p className="text-xs leading-relaxed text-neutral-500">
                  Minimum 4 characters. Stored only as a hash on this device.
                </p>
              </form>
            )}

            {authView === "change" && (
              <form
                onSubmit={(e) => {
                  void onChangeCode(e);
                }}
                className="flex flex-col gap-4 text-left"
              >
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Current code"
                  className="h-12 rounded-2xl border-white/10 bg-black/60 font-mono text-sm text-white placeholder:text-neutral-600"
                  value={currentCode}
                  onChange={(e) => setCurrentCode(e.target.value)}
                />
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="New code"
                  className="h-12 rounded-2xl border-white/10 bg-black/60 font-mono text-sm text-white placeholder:text-neutral-600"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm new code"
                  className="h-12 rounded-2xl border-white/10 bg-black/60 font-mono text-sm text-white placeholder:text-neutral-600"
                  value={code2}
                  onChange={(e) => setCode2(e.target.value)}
                />
                {error ? (
                  <p className="text-center text-xs text-red-400" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1 rounded-2xl border-white/15 font-mono text-xs uppercase"
                    onClick={() => {
                      setError(null);
                      setCode("");
                      setCode2("");
                      setCurrentCode("");
                      setAuthView("unlock");
                    }}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="h-12 flex-1 rounded-2xl font-mono text-xs uppercase tracking-wider">
                    Update code
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
