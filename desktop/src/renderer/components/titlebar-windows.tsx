import { cn } from "@/renderer/lib/utils";
import { APP_DISPLAY_NAME } from "@/shared/app-brand";
import React, { useEffect, useState } from "react";
import { Minus, Square, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import LogoRoundedSquareLight from "@/renderer/assets/logo-rounded-square-light.svg?url";
import LogoRoundedSquare from "@/renderer/assets/logo-rounded-square.svg?url";

import { ThemePicker } from "./theme-picker";
import { Button } from "./ui/button";
import { getWindowControls } from "@/renderer/lib/window-controls-bridge";

export function WindowsTitlebar({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const isHomePage = location.pathname === "/";

  const windowControls = getWindowControls();

  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    void windowControls
      .isMaximized()
      .then(setIsMaximized)
      .catch(() => setIsMaximized(false));
  }, [windowControls]);

  return (
    <div
      className={cn(
        "draglayer fixed z-10 flex min-h-12 w-screen border-b border-[var(--av-border)] bg-[var(--av-bg)] text-[var(--av-text)]",
        className
      )}
    >
      <div className="flex items-center gap-2 px-4 w-full">
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
              {APP_DISPLAY_NAME}
            </span>
          </button>
        )}

        {children}

        <div className="flex flex-auto justify-end items-center gap-2 pr-1">
          <img
            className="h-8 w-8 shrink-0 rounded-lg ring-1 ring-white/10 dark:hidden select-none pointer-events-none"
            src={LogoRoundedSquare}
            alt=""
            draggable={false}
            title={APP_DISPLAY_NAME}
          />
          <img
            className="h-8 w-8 shrink-0 rounded-lg ring-1 ring-white/10 hidden dark:block select-none pointer-events-none"
            src={LogoRoundedSquareLight}
            alt=""
            draggable={false}
            title={APP_DISPLAY_NAME}
          />
          <ThemePicker className="clickable h-9 w-9 shrink-0" isIconFormat />
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 clickable"
              onClick={() => void windowControls.minimize()}
              aria-label="Minimize window"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 clickable"
              onClick={() => void windowControls.toggleMaximize().then(setIsMaximized)}
              aria-label={isMaximized ? "Restore window" : "Maximize window"}
            >
              <Square className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 clickable hover:bg-red-500"
              onClick={() => void windowControls.close()}
              aria-label="Close window"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

