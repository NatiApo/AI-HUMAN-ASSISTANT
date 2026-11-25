$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
foreach ($c in "node","npm") { if (-not (Get-Command $c -ErrorAction SilentlyContinue)) { Write-Host "$c not found. Install Node.js first." -ForegroundColor Red; exit 1 } }
if (-not (Test-Path "$root\backend\.env")) { Copy-Item "$root\backend\.env.example" "$root\backend\.env" }
Push-Location "$root\backend"; npm install; Pop-Location
Push-Location "$root\frontend"; npm install; Pop-Location
Write-Host "Done. Now edit backend\.env, then import database\schema.sql" -ForegroundColor Green
