import { Button } from "@/renderer/components/ui/button";
import { Input } from "@/renderer/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/renderer/components/ui/tabs";
import React, { useCallback, useEffect, useState } from "react";

import { anivaultFetch, type MeResponse } from "@/renderer/lib/anivault-api";
import type { AnivaultStoreSchema } from "@/shared/anivault-types";

type AuditEntry = {
  id: string;
  actor_id: string | null;
  action: string;
  detail: string | null;
  created_at: string;
};

type AuthResponse = { token: string; plan: AnivaultStoreSchema["plan"] };

export function AccountPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditErr, setAuditErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await anivaultFetch<MeResponse>("/api/me");
    if (res.ok && res.data?.user) {
      setMe(res.data.user);
      await window.anivault.setConfig({ plan: res.data.user.plan });
    } else setMe(null);
  }, []);

  const loadAudit = useCallback(async () => {
    setAuditErr(null);
    const res = await anivaultFetch<{ entries: AuditEntry[] }>("/api/admin/audit");
    if (!res.ok) {
      setAudit([]);
      setAuditErr(res.error ?? "Audit unavailable");
      return;
    }
    setAudit(res.data?.entries ?? []);
  }, []);

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

  const login = async () => {
    setMsg(null);
    const res = await anivaultFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok || !res.data?.token) {
      setMsg(res.error ?? "Login failed");
      return;
    }
    await persistSession(res.data);
    setMsg("Signed in");
  };

  const register = async () => {
    setMsg(null);
    if (!email.trim() || !password) {
      setMsg("Email and password required");
      return;
    }
    if (password !== confirmPassword) {
      setMsg("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setMsg("Password must be at least 6 characters");
      return;
    }
    const res = await anivaultFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    if (!res.ok || !res.data?.token) {
      setMsg(res.error ?? "Could not create account");
      return;
    }
    await persistSession(res.data);
    setMsg("Account created — you are signed in");
    setConfirmPassword("");
  };

  const logout = async () => {
    await window.anivault.setConfig({ authToken: "", plan: "free" });
    setMe(null);
    setMsg("Signed out");
  };

  return (
    <div className="mx-auto max-w-md space-y-6 text-[var(--av-text)]">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Account</h2>
        <p className="mt-1 text-sm text-[var(--av-muted)]">AniVault Cloud · sign in</p>
      </div>

      {me ? (
        <div className="space-y-3 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] p-5">
          <p className="text-sm">
            <span className="text-[var(--av-muted)]">Email</span>{" "}
            <span className="font-medium">{me.email}</span>
          </p>
          <p className="text-sm">
            <span className="text-[var(--av-muted)]">Access</span>{" "}
            <span className="font-medium">Full catalog</span>
          </p>
          {me.moderator ? (
            <p className="text-[10px] text-[var(--av-muted-foreground)]">Moderator</p>
          ) : null}
          {me.admin ? (
            <p className="text-[10px] text-[var(--av-muted-foreground)]">Server admin</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl text-xs text-[var(--av-muted)] hover:text-[var(--av-text)]"
              onClick={() => void logout()}
            >
              Sign out
            </Button>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] p-1">
            <TabsTrigger
              value="signin"
              className="rounded-xl text-xs data-[state=active]:bg-[var(--av-accent-muted)] data-[state=active]:text-[var(--av-text)]"
            >
              Sign in
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="rounded-xl text-xs data-[state=active]:bg-[var(--av-accent-muted)] data-[state=active]:text-[var(--av-text)]"
            >
              Create account
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="signin"
            className="mt-4 space-y-3 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] p-5"
          >
            <Input
              type="email"
              placeholder="Email"
              className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Password"
              className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button
              type="button"
              className="w-full rounded-xl bg-[var(--av-text)] text-[var(--av-bg)] hover:opacity-90"
              onClick={() => void login()}
            >
              Sign in
            </Button>
            <p className="text-[10px] text-[var(--av-muted-foreground)]">
              Demo: <span className="font-mono text-[var(--av-muted)]">demo@anivault.local</span> /{" "}
              <span className="font-mono text-[var(--av-muted)]">demo1234</span> when using the bundled server.
            </p>
          </TabsContent>
          <TabsContent
            value="register"
            className="mt-4 space-y-3 rounded-2xl border border-[var(--av-border)] bg-[var(--av-surface)] p-5"
          >
            <Input
              type="email"
              placeholder="Email"
              className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Password (min 6 characters)"
              className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              type="password"
              placeholder="Confirm password"
              className="rounded-xl border-[var(--av-border)] bg-[var(--av-bg)] text-sm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Button
              type="button"
              className="w-full rounded-xl bg-[var(--av-text)] text-[var(--av-bg)] hover:opacity-90"
              onClick={() => void register()}
            >
              Create account
            </Button>
            <p className="text-[10px] leading-relaxed text-[var(--av-muted-foreground)]">
              Requires the AniVault API in Settings. You will be signed in after registration.
            </p>
          </TabsContent>
        </Tabs>
      )}

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

      {msg ? (
        <p className="text-center text-[10px] text-[var(--av-muted)]">{msg}</p>
      ) : null}
    </div>
  );
}
