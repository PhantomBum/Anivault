import { cn } from "@/renderer/lib/utils";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import LogoRoundedSquareLight from "@/renderer/assets/logo-rounded-square-light.svg?url";
import LogoRoundedSquare from "@/renderer/assets/logo-rounded-square.svg?url";

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
            <img
              className="h-5 w-5 shrink-0 rounded dark:hidden select-none pointer-events-none"
              src={LogoRoundedSquare}
              alt=""
              draggable={false}
            />
            <img
              className="h-5 w-5 shrink-0 rounded hidden dark:block select-none pointer-events-none"
              src={LogoRoundedSquareLight}
              alt=""
              draggable={false}
            />
            <span className="text-[0.8rem] font-semibold tracking-tight text-[var(--av-text)]">
              AniVault
            </span>
          </button>
        )}

        {children}

        <div className="flex flex-auto justify-end gap-2">
          <ThemePicker className="clickable" isIconFormat />
        </div>
      </div>
    </div>
  );
}

