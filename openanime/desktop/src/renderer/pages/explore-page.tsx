import { Compass, Search, Sparkles } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

import { Button } from "@/renderer/components/ui/button";

const SPOTLIGHT = [
  { title: "Trending action", hint: "High-energy picks from the catalog" },
  { title: "Seasonal", hint: "What is airing right now" },
  { title: "Classics", hint: "Long-running series worth revisiting" },
];

export function ExplorePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-2 text-[var(--av-text)]">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--av-accent)]">
          Explore
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Discover the catalog</h1>
        <p className="max-w-lg text-sm leading-relaxed text-[var(--av-muted)]">
          Browse by mood, jump into search, or open the home hub. This view mirrors the legacy HTML
          prototype: spotlight rows will expand as we wire more curated feeds.
        </p>
      </header>

      <div className="relative overflow-hidden rounded-3xl border border-[var(--av-border)] bg-[var(--av-surface)] p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--av-accent-muted)] blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--av-accent-muted)] text-[var(--av-accent)]">
              <Sparkles className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Start with search</h2>
              <p className="mt-1 text-sm text-[var(--av-muted)]">
                The fastest way to find a series is still the global search (same ani-cli source as
                the home page).
              </p>
            </div>
          </div>
          <Button
            asChild
            className="h-11 shrink-0 rounded-2xl bg-[var(--av-text)] px-6 text-[var(--av-bg)] hover:opacity-90"
          >
            <Link to="/anime" className="inline-flex items-center gap-2">
              <Search className="h-4 w-4" />
              Open search
            </Link>
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--av-muted)]">
          Spotlight rows
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {SPOTLIGHT.map((s) => (
            <div
              key={s.title}
              className="flex flex-col rounded-2xl border border-[var(--av-border)] bg-[var(--av-bg-elevated)] p-4 transition-colors hover:border-[var(--av-accent-dim)]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--av-surface)] text-[var(--av-accent)]">
                <Compass className="h-5 w-5" />
              </div>
              <p className="font-semibold leading-snug">{s.title}</p>
              <p className="mt-1 text-xs text-[var(--av-muted)]">{s.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-[var(--av-muted-foreground)]">
        Tip: use <kbd className="rounded-md border border-[var(--av-border)] bg-[var(--av-surface)] px-1.5 py-0.5 font-mono text-[10px]">Alt+2</kbd>{" "}
        anywhere to jump to search.
      </p>
    </div>
  );
}
