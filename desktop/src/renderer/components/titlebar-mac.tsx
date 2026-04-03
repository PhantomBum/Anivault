import { cn } from "@/renderer/lib/utils";
import { APP_DISPLAY_NAME } from "@/shared/app-brand";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AniVaultWordmark } from "@/renderer/components/anivault-wordmark";
import { ThemePicker } from "./theme-picker";

export function MacTitlebar({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const isHomePage = location.pathname === "/";

  return (
    <div
      className={cn(
        "draglayer fixed z-10 flex min-h-12 w-screen border-b border-[var(--av-border)] bg-[var(--av-bg)] text-[var(--av-text)]",
        className
      )}
    >
      <div className="flex w-full items-center gap-2 px-4 pl-20">
        {!isHomePage && (
          <button
            type="button"
            className="flex items-center gap-2 clickable"
            onClick={() => navigate("/")}
          >
            <AniVaultWordmark size="titlebar" />
            <span className="text-[0.72rem] font-medium tracking-tight text-[var(--av-muted)]">
              Unvaulted
            </span>
          </button>
        )}

        {children}

        <div className="flex flex-auto items-center justify-end gap-2">
          <div className="pointer-events-none pr-1 select-none" title={APP_DISPLAY_NAME}>
            <AniVaultWordmark size="sm" />
          </div>
          <ThemePicker className="clickable" isIconFormat />
        </div>
      </div>
    </div>
  );
}

