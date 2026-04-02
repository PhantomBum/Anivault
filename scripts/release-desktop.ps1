# Release AniVault desktop to GitHub (triggers CI that uploads AniVaultSetup.exe + updater files).
#
# Usage (from repo root, PowerShell):
#   .\scripts\release-desktop.ps1 1.0.0-alpha.11
#
# This script:
#   1) Sets desktop/package.json "version" to the argument
#   2) Commits and pushes to main
#   3) Creates tag v<version> and pushes the tag (starts "Release desktop (Windows)" on GitHub)

param(
  [Parameter(Mandatory = $true, HelpMessage = "Semver, e.g. 1.0.0-alpha.5")]
  [string]$Version
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$pkg = Join-Path $repoRoot "desktop\package.json"
if (-not (Test-Path $pkg)) {
  throw "Not found: $pkg (run this from the anivault repo; script lives in scripts\)"
}

Write-Host "Setting desktop/package.json version -> $Version"
node -e "const fs=require('fs');const p='desktop/package.json';const j=JSON.parse(fs.readFileSync(p));j.version='$Version';fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n')"

git add desktop/package.json
git commit -m "chore(desktop): release v$Version"
git push origin HEAD

$tag = "v$Version"
Write-Host "Tagging $tag and pushing (starts CI release workflow)..."
git tag -a $tag -m "Desktop $tag"
git push origin $tag

Write-Host ""
Write-Host "Done. Open: https://github.com/PhantomBum/Anivault/actions"
Write-Host "Wait for 'Release desktop (Windows)' to turn green, then check:"
Write-Host "https://github.com/PhantomBum/Anivault/releases/tag/$tag"
Write-Host "You should see AniVaultSetup.exe, latest.yml (and optional .blockmap) under Assets."
