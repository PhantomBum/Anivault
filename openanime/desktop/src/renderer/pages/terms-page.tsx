import React from "react";

export function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-4 text-[var(--av-text)]">
      <h2 className="text-lg font-bold">Terms of service</h2>
      <div className="space-y-3 text-sm leading-relaxed text-[var(--av-muted)]">
        <p>
          AniVault is an unofficial desktop client for discovering and playing streams via{" "}
          <strong className="text-[var(--av-text)]">ani-cli</strong> and related tooling. You are
          responsible for complying with the laws in your jurisdiction and the terms of any sites or
          services you access.
        </p>
        <p>
          The app, community features, and gallery are provided “as is” without warranties. Do not
          use AniVault to distribute copyrighted content without authorization.
        </p>
        <p>
          For questions about this build, refer to your distributor or the project repository.
        </p>
      </div>
    </div>
  );
}
