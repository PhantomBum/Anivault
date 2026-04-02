import { Button } from "@/renderer/components/ui/button";
import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string | null };

/**
 * Catches render errors in route content so a failed page does not blank the whole shell.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error("[RouteErrorBoundary]", err, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 bg-[var(--av-bg)] p-8 text-center text-[var(--av-text)]">
          <p className="max-w-md text-sm text-red-400" role="alert">
            {this.state.message ?? "Something went wrong while rendering this page."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              Reload app
            </Button>
            <Button type="button" variant="secondary" asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
