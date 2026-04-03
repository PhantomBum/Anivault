import React, { useEffect, useRef, useState } from "react";

/** Custom pointer (`public/cursor-pointer.png`) — white via CSS filter. Hotspot at arrow tip (right wedge ~24px asset). */
const CURSOR_PNG = `${import.meta.env.BASE_URL}cursor-pointer.png`;
const VIEW_W = 30;
const VIEW_H = 30;
/** Tip of the pointer in image space — nudged left/up so the wedge feels aligned with the OS hit point. */
const HOTSPOT_X = 24;
const HOTSPOT_Y = 9;
/** Follow lag (higher = snappier). */
const POINTER_STIFFNESS = 14;
const POSITION_STIFFNESS = 22;
const INTERACTIVE_SELECTOR =
  'a[href], button, [role="button"], input:not([type="hidden"]), textarea, select, label, summary, [data-cursor="pointer"]';

function smoothToward(current: number, target: number, dt: number, stiffness: number) {
  const t = 1 - Math.exp(-stiffness * Math.min(dt, 0.064));
  return current + (target - current) * t;
}

export function SmoothCursor() {
  const [mounted, setMounted] = useState(false);
  const [pngFailed, setPngFailed] = useState(false);

  const rootEl = useRef<HTMLDivElement | null>(null);

  const targetRef = useRef({ x: -100, y: -100 });
  const renderRef = useRef({ x: -100, y: -100 });
  const visibleRef = useRef(false);
  const interactiveRef = useRef(false);
  const pressedRef = useRef(false);
  const scaleRef = useRef(1);
  const rafRef = useRef(0);
  const lastTRef = useRef(0);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (coarse.matches || reduced.matches) {
      return;
    }

    setMounted(true);
    document.documentElement.classList.add("av-custom-cursor-active");

    const apply = (x: number, y: number, opacity: number, scale: number) => {
      const el = rootEl.current;
      if (!el) return;
      el.style.opacity = String(opacity);
      el.style.transform = `translate3d(${x - HOTSPOT_X}px, ${y - HOTSPOT_Y}px, 0) scale(${scale})`;
    };
    renderRef.current = { x: -100, y: -100 };

    const onMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      visibleRef.current = true;

      const el = e.target as Element | null;
      let nextInteractive = false;
      if (el) {
        const isTextInput =
          el instanceof HTMLInputElement &&
          ["text", "search", "email", "url", "password", "number"].includes(el.type);
        const isTextArea = el instanceof HTMLTextAreaElement;
        const isEditable = (el as HTMLElement).isContentEditable;
        if (!isTextInput && !isTextArea && !isEditable) {
          nextInteractive = Boolean(el.closest(INTERACTIVE_SELECTOR));
        }
      }
      interactiveRef.current = nextInteractive;
    };

    const onLeave = () => {
      visibleRef.current = false;
    };
    const onEnter = () => {
      visibleRef.current = true;
    };

    const onDown = () => {
      pressedRef.current = true;
    };
    const onUp = () => {
      pressedRef.current = false;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });

    const loop = (now: number) => {
      const last = lastTRef.current || now;
      const dt = Math.min((now - last) / 1000, 0.05);
      lastTRef.current = now;

      const tx = targetRef.current.x;
      const ty = targetRef.current.y;

      const rx = smoothToward(renderRef.current.x, tx, dt, POSITION_STIFFNESS);
      const ry = smoothToward(renderRef.current.y, ty, dt, POSITION_STIFFNESS);
      renderRef.current = { x: rx, y: ry };

      const vis = visibleRef.current ? 1 : 0;
      const scaleTarget = pressedRef.current ? 0.88 : interactiveRef.current ? 0.92 : 1;
      scaleRef.current = smoothToward(scaleRef.current, scaleTarget, dt, POINTER_STIFFNESS * 1.25);

      apply(rx, ry, vis, scaleRef.current);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.classList.remove("av-custom-cursor-active");
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      ref={rootEl}
      className="pointer-events-none fixed left-0 top-0 z-[99999] select-none will-change-transform"
      style={{
        width: VIEW_W,
        height: VIEW_H,
        opacity: 0,
        transform: "translate3d(-100px,-100px,0)",
      }}
      aria-hidden
    >
      {!pngFailed ? (
        <img
          src={CURSOR_PNG}
          width={VIEW_W}
          height={VIEW_H}
          alt=""
          draggable={false}
          className="block h-[30px] w-[30px] object-contain"
          style={{
            // Black PNG → white arrow; drop-shadow keeps edge on dark backgrounds
            filter:
              "brightness(0) invert(1) drop-shadow(0 0 0.5px #000) drop-shadow(0 1px 1.5px rgba(0,0,0,0.95))",
          }}
          onError={() => setPngFailed(true)}
        />
      ) : (
        <svg
          width={VIEW_W}
          height={VIEW_H}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
          aria-hidden
        >
          <path
            d="M3 4 L3 20 L21 12 Z"
            fill="#ffffff"
            stroke="#0a0a0f"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
