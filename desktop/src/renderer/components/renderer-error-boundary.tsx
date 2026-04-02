import { AlertTriangle } from "lucide-react";
import React, { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/renderer/components/ui/button";

type Props = { children: ReactNode };

type State = { hasError: boolean; message: string | null };

/**
 * Catches React render errors so a blank shell is replaced with reload affordance.
 */
export class RendererErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message || "Unknown error" };
  }

  override componentDidCatch(err: Error, info: ErrorInfo): void {
    console.error("[anivault-renderer] component error", err, info.componentStack);
  }

  private reload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--av-bg)] px-6 text-center text-[var(--av-text)]">
          <AlertTriangle className="h-12 w-12 text-amber-500/90" aria-hidden />
          <div className="max-w-md space-y-2">
            <p className="text-lg font-semibold">Something broke in the interface</p>
            <p className="text-sm text-[var(--av-muted-foreground)]">
              {this.state.message}
            </p>
            <p className="text-xs text-[var(--av-muted)]">
              Reloading usually fixes transient UI errors. If this keeps happening, try restarting AniVault.
            </p>
          </div>
          <Button type="button" className="rounded-xl" onClick={this.reload}>
            Reload AniVault
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
