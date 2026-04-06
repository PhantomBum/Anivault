import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/renderer/components/ui/tabs";
import { showToast } from "@/renderer/lib/av-toast";
import {
  anivaultFetch,
  pingCompanionHealth,
  type MeResponse,
} from "@/renderer/lib/anivault-api";
import { cn } from "@/renderer/lib/utils";
import { APP_DISPLAY_NAME } from "@/shared/app-brand";
import { DEFAULT_COMPANION_API_BASE_URL, type AnivaultStoreSchema } from "@/shared/anivault-types";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Server } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

type AuditEntry = {
  id: string;
  actor_id: string | null;
  action: string;
  detail: string | null;
  created_at: string;
};

type AuthResponse = {
  token: string;
  refreshToken?: string;
  plan: AnivaultStoreSchema["plan"];
};

type ConnState = "checking" | "online" | "offline";

function mapRegisterError(err: string | undefined): string {
  if (!err) return "Could not create account.";
  const e = err.toLowerCase();
  if (e.includes("already registered") || e.includes("409")) {
    return "That email is already registered. Try Sign in instead, or use a different email.";
  }
  return err;
}

export function AccountPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditErr, setAuditErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [conn, setConn] = useState<ConnState>("checking");
  const [connDetail, setConnDetail] = useState<string>("");
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(DEFAULT_COMPANION_API_BASE_URL);

  const runHealthCheck = useCallback(async () => {
    setConn("checking");
    setConnDetail("");
    const base =
      typeof window !== "undefined" && window.anivault
        ? await window.anivault.getConfig("apiBaseUrl")
        : DEFAULT_COMPANION_API_BASE_URL;
    const display = typeof base === "string" && base.trim() ? base.trim() : DEFAULT_COMPANION_API_BASE_URL;
    setApiBaseUrl(display);
    const res = await pingCompanionHealth();
    setConnDetail(res.message);
    setConn(res.ok ? "online" : "offline");
  }, []);

  const refresh = useCallback(async () => {
    const res = await anivaultFetch<MeResponse>("/v1/me");
    if (res.ok && res.data?.user) {
      setMe(res.data.user);
      await window.anivault.setConfig({ plan: res.data.user.plan });
    } else setMe(null);
  }, []);

  const loadAudit = useCallback(async () => {
    setAuditErr(null);
    const res = await anivaultFetch<{ entries: AuditEntry[] }>("/v1/admin/audit");
    if (!res.ok) {
      setAudit([]);
      setAuditErr(res.error ?? "Audit unavailable");
      return;
    }
    setAudit(res.data?.entries ?? []);
  }, []);

  useEffect(() => {
    void runHealthCheck();
  }, [runHealthCheck]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (me?.admin) void loadAudit();
    else setAudit([]);
  }, [me?.admin, loadAudit]);

  const persistSession = async (data: AuthResponse) => {
    await window.anivault.setConfig({
      authToken: data.token,
      plan: data.plan ?? "free",
    });
    void refresh();
  };

  const canSubmitAuth = conn === "online" && !loading;

  const login = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    if (!conn || conn !== "online") {
      setErrorMsg("Wait until the companion server shows Online, or fix the URL under Settings → Playback.");
      return;
    }
    if (!email.trim() || !password) {
      setErrorMsg("Enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await anivaultFetch<AuthResponse>("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok || !res.data?.token) {
        setErrorMsg(res.error ?? "Login failed.");
        return;
      }
      await persistSession(res.data);
      setInfoMsg("Signed in.");
      showToast("Signed in");
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    if (conn !== "online") {
      setErrorMsg("Start the companion server and wait for Online status above.");
      return;
    }
    const em = email.trim().toLowerCase();
    if (!em || !em.includes("@")) {
      setErrorMsg("Enter a valid email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Choose a password.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await anivaultFetch<AuthResponse>("/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: em, password }),
      });
      if (!res.ok || !res.data?.token) {
        setErrorMsg(mapRegisterError(res.error));
        return;
      }
      await persistSession(res.data);
      setConfirmPassword("");
      setPassword("");
      setInfoMsg("Welcome — your account is ready and you are signed in.");
      showToast("Account created");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await window.anivault.setConfig({ authToken: "", plan: "free" });
    setMe(null);
    setInfoMsg("Signed out.");
    setErrorMsg(null);
  };

  const pwdMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const pwdWeak = password.length > 0 && password.length < 6;

  return (
    <div className="av-page-shell mx-auto max-w-lg space-y-5 py-2 text-[var(--av-text)]">
      <div className="av-page-hero">
        <h2 className="text-lg font-bold tracking-tight">Account</h2>
        <p className="mt-1 text-xs text-[var(--av-muted)]">
          {APP_DISPLAY_NAME} uses an optional <strong className="font-medium text-[var(--av-text)]">local companion server</strong> for
          sign-in, gallery, and community features. Playback does not require an account.
        </p>
      </div>

      {/* Connection — must work before register/login */}
      <div
        className="rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] p-4 shadow-av-sm"
        role="region"
        aria-label="Companion server status"
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              conn === "online" && "bg-emerald-500/15 text-emerald-400",
              conn === "offline" && "bg-red-500/10 text-red-400",
              conn === "checking" && "bg-[var(--av-bg-elevated)] text-[var(--av-muted)]"
            )}
          >
            {conn === "checking" ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : conn === "online" ? (
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            ) : (
              <AlertCircle className="h-5 w-5" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[var(--av-text)]">Companion server</p>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  conn === "online" && "bg-emerald-500/15 text-emerald-300",
                  conn === "offline" && "bg-red-500/15 text-red-300",
                  conn === "checking" && "bg-[var(--av-bg-elevated)] text-[var(--av-muted)]"
                )}
              >
                {conn === "checking" ? "Checking…" : conn === "online" ? "Online" : "Offline"}
              </span>
            </div>
            <p className="flex items-center gap-1.5 break-all font-mono text-[11px] text-[var(--av-muted)]">
              <Server className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {apiBaseUrl}
            </p>
            <p className="text-xs leading-relaxed text-[var(--av-muted-foreground)]">{connDetail}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl text-xs"
                onClick={() => void runHealthCheck()}
                disabled={conn === "checking"}
              >
                <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", conn === "checking" && "animate-spin")} />
                Test connection
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-9 rounded-xl text-xs" asChild>
                <Link to="/settings?tab=playback">Server URL in Settings</Link>
              </Button>
            </div>
            {conn === "offline" ? (
              <p className="rounded-xl bg-[var(--av-bg-elevated)] px-3 py-2 text-[11px] leading-relaxed text-[var(--av-muted-foreground)]">
                From a terminal: <code className="font-mono text-[var(--av-muted)]">cd server</code> →{" "}
                <code className="font-mono text-[var(--av-muted)]">npm install</code> →{" "}
                <code className="font-mono text-[var(--av-muted)]">npm start</code>
                . Default port is <strong className="text-[var(--av-text)]">3847</strong>.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {me ? (
        <div className="space-y-3 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] p-5">
          <p className="text-sm">
            <span className="text-[var(--av-muted)]">Signed in as</span>{" "}
            <span className="font-medium">{me.email}</span>
          </p>
          <p className="text-sm">
            <span className="text-[var(--av-muted)]">Plan</span>{" "}
            <span className="font-medium capitalize">{me.plan ?? "free"}</span>
          </p>
          {me.moderator ? (
            <p className="text-[10px] text-[var(--av-muted-foreground)]">Moderator</p>
          ) : null}
          {me.admin ? (
            <p className="text-[10px] text-[var(--av-muted-foreground)]">Server admin</p>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl text-xs text-[var(--av-muted)] hover:text-[var(--av-text)]"
            onClick={() => void logout()}
          >
            Sign out
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] p-1">
            <TabsTrigger
              value="register"
              className="rounded-xl text-xs data-[state=active]:bg-[var(--av-accent-muted)] data-[state=active]:text-[var(--av-text)]"
            >
              Create account
            </TabsTrigger>
            <TabsTrigger
              value="signin"
              className="rounded-xl text-xs data-[state=active]:bg-[var(--av-accent-muted)] data-[state=active]:text-[var(--av-text)]"
            >
              Sign in
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="register"
            className="mt-4 space-y-4 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] p-5"
          >
            <p className="text-xs text-[var(--av-muted-foreground)]">
              Choose an email and password. They are stored on <strong className="text-[var(--av-text)]">your</strong> companion server only,
              not by {APP_DISPLAY_NAME} as a hosted service.
            </p>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-[var(--av-muted)]" htmlFor="acc-email-reg">
                Email
              </label>
              <Input
                id="acc-email-reg"
                type="email"
                placeholder="you@example.com"
                className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-[var(--av-muted)]" htmlFor="acc-pass-reg">
                Password
              </label>
              <Input
                id="acc-pass-reg"
                type="password"
                placeholder="At least 6 characters"
                className={cn(
                  "rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm",
                  pwdWeak && "border-amber-500/50"
                )}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              {pwdWeak ? (
                <p className="text-[10px] text-amber-400/90">Use at least 6 characters.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-[var(--av-muted)]" htmlFor="acc-pass2">
                Confirm password
              </label>
              <Input
                id="acc-pass2"
                type="password"
                placeholder="Repeat password"
                className={cn(
                  "rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm",
                  pwdMismatch && "border-red-500/40"
                )}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {pwdMismatch ? <p className="text-[10px] text-red-400/90">Passwords do not match.</p> : null}
            </div>
            <Button
              type="button"
              className="w-full rounded-xl bg-[var(--av-text)] text-[var(--av-bg)] hover:opacity-90 disabled:opacity-50"
              onClick={() => void register()}
              disabled={!canSubmitAuth}
            >
              {loading ? "Creating account…" : "Create account"}
            </Button>
            {!canSubmitAuth && conn === "offline" ? (
              <p className="text-center text-[10px] text-[var(--av-muted-foreground)]">
                Create account is available when the server shows <strong className="text-[var(--av-text)]">Online</strong>.
              </p>
            ) : null}
          </TabsContent>

          <TabsContent
            value="signin"
            className="mt-4 space-y-4 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] p-5"
          >
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-[var(--av-muted)]" htmlFor="acc-email-in">
                Email
              </label>
              <Input
                id="acc-email-in"
                type="email"
                placeholder="Email"
                className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-[var(--av-muted)]" htmlFor="acc-pass-in">
                Password
              </label>
              <Input
                id="acc-pass-in"
                type="password"
                placeholder="Password"
                className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button
              type="button"
              className="w-full rounded-xl bg-[var(--av-text)] text-[var(--av-bg)] hover:opacity-90 disabled:opacity-50"
              onClick={() => void login()}
              disabled={!canSubmitAuth}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-[10px] text-[var(--av-muted-foreground)]">
              Local demo (if you use the seeded server):{" "}
              <span className="font-mono text-[var(--av-muted)]">demo@anivault.local</span> /{" "}
              <span className="font-mono text-[var(--av-muted)]">demo1234</span>
            </p>
          </TabsContent>
        </Tabs>
      )}

      {errorMsg ? (
        <p
          className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-center text-xs text-red-200/95"
          role="alert"
        >
          {errorMsg}
        </p>
      ) : null}
      {infoMsg && !errorMsg ? (
        <p className="text-center text-xs text-[var(--av-muted)]">{infoMsg}</p>
      ) : null}

      {me?.admin ? (
        <div className="space-y-2 rounded-2xl border border-dashed border-[var(--av-border)] bg-[var(--av-bg-elevated)] p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-[var(--av-muted)]">Audit log</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-[10px]"
              onClick={() => void loadAudit()}
            >
              Refresh
            </Button>
          </div>
          {auditErr ? <p className="text-[10px] text-red-400">{auditErr}</p> : null}
          <ul className="max-h-64 space-y-1 overflow-y-auto text-[10px] text-[var(--av-muted)]">
            {audit.map((e) => (
              <li key={e.id} className="border-b border-[var(--av-border)]/60 pb-1 font-mono last:border-0">
                <span className="text-[var(--av-text)]">{e.action}</span> · {e.detail ?? "—"} ·{" "}
                {new Date(e.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
