/**
 * Builds rounded-corner variants of the app icon for Windows taskbar / window chrome.
 * Run: node scripts/round-app-icon.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const sharp = require("sharp");

  const publicDir = path.join(__dirname, "..", "public");
  const inPath = path.join(publicDir, "icon.png");
  if (!fs.existsSync(inPath)) {
    console.error("Missing public/icon.png");
    process.exit(1);
  }

  const size = 256;
  const radius = Math.round(size * 0.2);
  const svg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/></svg>`
  );

  const roundedPng = path.join(publicDir, "icon-rounded.png");
  await sharp(inPath)
    .resize(size, size, { fit: "cover" })
    .ensureAlpha()
    .composite([{ input: svg, blend: "dest-in" }])
    .png()
    .toFile(roundedPng);

  const { default: pngToIco } = await import("png-to-ico");
  const buf = await pngToIco(roundedPng);
  fs.writeFileSync(path.join(publicDir, "icon-rounded.ico"), buf);
  console.log("Wrote public/icon-rounded.png and public/icon-rounded.ico");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
