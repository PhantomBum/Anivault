/**
 * Removes `out/` so `npm run make` can rebuild. On Windows, EPERM usually means
 * anivault.exe is still running or Explorer has the folder open.
 */
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "out");

if (!fs.existsSync(outDir)) {
  process.exit(0);
}

try {
  fs.rmSync(outDir, { recursive: true, force: true });
  console.log("Removed out/");
} catch (err) {
  const code = err && typeof err === "object" && "code" in err ? err.code : "";
  console.error(
    code === "EPERM" || code === "EBUSY"
      ? [
          "Could not delete out/ (file in use).",
          "  1. Quit AniVault completely (check Task Manager for anivault.exe).",
          "  2. Close any File Explorer window showing the out folder.",
          "  3. Temporarily pause real-time antivirus scan on this folder if needed.",
          "  4. Run: npm run clean",
        ].join("\n")
      : String(err)
  );
  process.exit(1);
}
