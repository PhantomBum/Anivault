# One-time: use repo-managed git hooks (auto-push after each commit).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root
git config core.hooksPath .githooks
Write-Host "Configured: git core.hooksPath = .githooks"
Write-Host "Commits on this clone will run post-commit -> git push origin <branch>"
