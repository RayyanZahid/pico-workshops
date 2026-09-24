# PICO WebSpatial Academy: Windows installer.
#
#   powershell -ExecutionPolicy Bypass -File setup\install-windows.ps1                    print the plan, change nothing
#   powershell -ExecutionPolicy Bypass -File setup\install-windows.ps1 --yes              core: Node, Git, Claude Code, pico-cli, lab deps
#   powershell -ExecutionPolicy Bypass -File setup\install-windows.ps1 --yes --emulator   + Android Studio 2025.1.4.8, emulator chain, web runtime
#   powershell -ExecutionPolicy Bypass -File setup\install-windows.ps1 --yes --agent      + PICO plugin and knowledge MCP for Claude Code
#
# Idempotent: every step checks first and skips what is already there. Nothing is installed
# without --yes. Every command is cited in setup\DEPENDENCIES.md.

$ErrorActionPreference = 'Stop'
$flags = @($args | ForEach-Object { "$_".ToLower() })
$Yes      = $flags -contains '--yes'      -or $flags -contains '-yes'
$Emulator = $flags -contains '--emulator' -or $flags -contains '-emulator'
$Agent    = $flags -contains '--agent'    -or $flags -contains '-agent'
$Kit      = Split-Path -Parent $PSScriptRoot

function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}
function Has($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Out1($cmd, $a) { try { (& $cmd @a 2>$null | Select-Object -First 1) } catch { '' } }

$planned = 0
function Step($title, [scriptblock]$isDone, [string]$command, [scriptblock]$action) {
  if (& $isDone) { Write-Host "  [skip] $title" -ForegroundColor DarkGray; return }
  $script:planned++
  if (-not $Yes) { Write-Host "  [todo] $title`n         $command" -ForegroundColor Yellow; return }
  Write-Host "  [run ] $title`n         $command" -ForegroundColor Cyan
  & $action
  Refresh-Path
  if (& $isDone) { Write-Host "  [ ok ] $title" -ForegroundColor Green }
  else { Write-Host "  [????] $title ran but the check still fails. Open a NEW terminal and re-run this script; if it persists, run: node setup\doctor.mjs" -ForegroundColor Red }
}

function NodeOk {
  if (-not (Has node)) { return $false }
  $v = (Out1 node @('--version')) -replace '^v', ''
  $p = $v.Split('.') | ForEach-Object { [int]$_ }
  return (($p[0] -eq 20 -and ($p[1] -gt 19 -or $p[1] -eq 19)) -or $p[0] -gt 22 -or ($p[0] -eq 22 -and $p[1] -ge 12))
}
function PicoCliOk { (Has pico-cli) -and ((Out1 pico-cli @('--version')) -match '^pico-cli/') }
function StudioOk {
  $roots = @("$env:ProgramFiles\Android", "$env:LOCALAPPDATA\Programs", "$env:LOCALAPPDATA\JetBrains\Toolbox\apps\AndroidStudio")
  foreach ($r in $roots) {
    if (-not (Test-Path $r)) { continue }
    foreach ($pi in Get-ChildItem $r -Recurse -Depth 3 -Filter product-info.json -ErrorAction SilentlyContinue) {
      $j = Get-Content $pi.FullName -Raw | ConvertFrom-Json
      if ("$($j.version)$($j.dataDirectoryName)" -match '2025\.1') { return $true }
    }
  }
  return $false
}
$PicoHome = if ($env:PICO_HOME) { $env:PICO_HOME } else { "$env:LOCALAPPDATA\PICO\sdk" }

Write-Host "`nPICO WebSpatial Academy installer (Windows)" -ForegroundColor White
if (-not $Yes) { Write-Host "Dry run: nothing will be installed. Re-run with --yes to act.`n" -ForegroundColor DarkYellow }
if (-not (Has winget)) { Write-Host "winget is missing. Install 'App Installer' from the Microsoft Store, then re-run." -ForegroundColor Red; exit 1 }

Write-Host "`n== Core (everyone)"
Step 'Node.js LTS (Vite 8 needs ^20.19 or >=22.12)' { NodeOk } 'winget install --id OpenJS.NodeJS.LTS -e' {
  winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements }
Step 'Git for Windows (Claude Code uses Git Bash; pico-cli needs git)' { Has git } 'winget install --id Git.Git -e' {
  winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements }
Step 'Claude Code (official native installer)' { Has claude } 'irm https://claude.ai/install.ps1 | iex' {
  Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression
  $env:Path += ";$env:USERPROFILE\.local\bin" }
if ((Has pico-cli) -and -not (PicoCliOk)) {
  Step 'Remove the unrelated unscoped `pico-cli` npm package' { PicoCliOk } 'npm uninstall -g pico-cli' { npm uninstall -g pico-cli }
}
Step 'PICO CLI (@picoxr/pico-cli, NOT the unscoped pico-cli)' { PicoCliOk } 'npm install -g @picoxr/pico-cli' { npm install -g '@picoxr/pico-cli' }
# cd first: `npm --prefix labs install` from the kit root installs the kit INTO labs (file:.. + a recursive link).
Step 'Lab dependencies' { Test-Path "$Kit\labs\node_modules" } "cd labs; npm install" { Push-Location "$Kit\labs"; try { npm install } finally { Pop-Location } }

if ($Emulator) {
  Write-Host "`n== PICO Emulator chain"
  Write-Host "  The PICO Emulator and PICO WebSpatial browser are licensed by PICO; tonight's attendees are cleared by PICO for this workshop.`n  pico-cli accepts the license on your behalf. Read it at https://developer.picoxr.com/document/distribute/sdk-license-terms/" -ForegroundColor Magenta
  Step 'Android Studio 2025.1.4.8 (PICO requires 2025.1.x exactly; the latest release will NOT work)' { StudioOk } 'winget install --id Google.AndroidStudio -e --version 2025.1.4.8' {
    winget install --id Google.AndroidStudio -e --version 2025.1.4.8 --accept-source-agreements --accept-package-agreements }
  Step 'PICO Spatial plugin, Android SDK 35, Java, PICO_HOME, emulator bundle, AVD (fills only the gaps)' {
    (Test-Path "$env:USERPROFILE\.pico\avd\*.ini") -and (Get-ChildItem "$env:APPDATA\Google" -Recurse -Depth 2 -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'pico|spatial' })
  } 'pico-cli emulator setup' { pico-cli emulator setup }
  Step 'PICO WebSpatial browser for `pico-cli web launch` (336 MB, do this at home)' {
    Get-ChildItem $PicoHome -Recurse -Depth 3 -Filter PicoBrowser.apk -ErrorAction SilentlyContinue } 'pico-cli web setup' { pico-cli web setup }
} else {
  Write-Host "`n== PICO Emulator chain: not requested (add --emulator). Without it you are on the web-only track." -ForegroundColor DarkGray
}

if ($Agent) {
  Write-Host "`n== Claude Code wiring"
  Write-Host "  Close every other Claude Code window first: pico-cli setup kills running pico-dev-knowledge servers." -ForegroundColor Magenta  Step 'PICO plugin (skills) + pico-dev-knowledge MCP for Claude Code' {
    (Test-Path "$env:USERPROFILE\.claude\plugins\installed_plugins.json") -and ((Get-Content "$env:USERPROFILE\.claude\plugins\installed_plugins.json" -Raw) -match 'pico-spatial-agentic-tools@') } 'pico-cli setup --agent-tool claude-code --platform spatial --scope global --yes' {
    pico-cli setup --agent-tool claude-code --platform spatial --scope global --yes }
} else {
  Write-Host "`n== Claude Code wiring: not requested (add --agent). Optional for the web labs." -ForegroundColor DarkGray
}

Write-Host ''
if (-not $Yes) { Write-Host "$planned step(s) to do. Re-run with --yes to apply them." -ForegroundColor Yellow }
if (Has node) { Write-Host "`nDoctor:" -ForegroundColor White; node "$Kit\setup\doctor.mjs" --quick $(if (-not $Emulator) { '--web-only' }) }
