import type { AnivaultStoreSchema } from "@/shared/anivault-types";

export function applyShellAppearance(
  partial: Pick<AnivaultStoreSchema, "chromaticEmphasis" | "shellPreset">
): void {
  const shell = document.querySelector(".anivault-shell");
  if (!shell) return;
  shell.setAttribute("data-chroma", partial.chromaticEmphasis);
  shell.setAttribute("data-shell-preset", partial.shellPreset);
}
