/**
 * Builds `installer/installing.gif` for Squirrel (shown during Setup.exe).
 * Run after changing the app icon: `node scripts/generate-installer-loading-gif.mjs`
 */
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.join(__dirname, "..");
const pngPath = path.join(desktopRoot, "public", "icon-rounded.png");
const outDir = path.join(desktopRoot, "installer");
const outPath = path.join(outDir, "installing.gif");

if (!existsSync(pngPath)) {
  console.error("Missing", pngPath);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

await sharp(pngPath)
  .resize(280, 280, {
    fit: "contain",
    background: { r: 9, g: 9, b: 11, alpha: 1 },
  })
  .gif()
  .toFile(outPath);

console.log("[installer] wrote", outPath);
