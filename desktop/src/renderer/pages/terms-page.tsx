import React from "react";

import { APP_DISPLAY_NAME } from "@/shared/app-brand";

export function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-6 text-[var(--av-text)]">
      <header className="space-y-1 border-b border-[var(--av-border)] pb-4">
        <h2 className="text-xl font-bold tracking-tight">Terms of service</h2>
        <p className="text-sm text-[var(--av-muted)]">
          Last updated for this build — read alongside your local laws and provider terms.
        </p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed text-[var(--av-muted)]">
        <h3 className="text-base font-semibold text-[var(--av-text)]">1. Unofficial client</h3>
        <p>
          {APP_DISPLAY_NAME} is an unofficial desktop app for discovering and playing streams via{" "}
          <strong className="text-[var(--av-text)]">ani-cli</strong> and related sources. It is not
          affiliated with content licensors, streaming sites, or AniList. AniList metadata is used
          under their public API terms and is labeled in the UI.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-[var(--av-muted)]">
        <h3 className="text-base font-semibold text-[var(--av-text)]">2. Mature (18+) content</h3>
        <p>
          Some catalog entries may be tagged ecchi or adult-oriented. When &quot;Allow mature
          (18+)&quot; is disabled in Settings, those entries are hidden from grids and series details
          stay gated. You are responsible for age-appropriate use in your jurisdiction.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-[var(--av-muted)]">
        <h3 className="text-base font-semibold text-[var(--av-text)]">3. Your responsibility</h3>
        <p>
          You agree to comply with applicable laws and with the terms of any sites or services you
          access. Do not use {APP_DISPLAY_NAME} to distribute copyrighted content without authorization.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-[var(--av-muted)]">
        <h3 className="text-base font-semibold text-[var(--av-text)]">4. Disclaimer</h3>
        <p>
          The app and optional community features are provided &quot;as is&quot; without warranties.
          To the maximum extent permitted by law, the authors and distributors disclaim liability
          for damages arising from use of the software.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-[var(--av-muted)]">
        <h3 className="text-base font-semibold text-[var(--av-text)]">5. Contact</h3>
        <p>
          For questions about this build, refer to your distributor or the project repository listed
          in the application metadata.
        </p>
      </section>
    </div>
  );
}
