import type { UiDensity } from "@/shared/anivault-types";

export function applyUiDensityToShell(density: UiDensity) {
  const shell = document.querySelector(".anivault-shell");
  if (shell) shell.setAttribute("data-density", density);
}
