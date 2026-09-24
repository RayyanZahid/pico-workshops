#!/usr/bin/env bash
# PICO WebSpatial Academy: macOS installer.
#
#   bash setup/install-macos.sh                    print the plan, change nothing
#   bash setup/install-macos.sh --yes              core: Node, Git, Claude Code, pico-cli, lab deps
#   bash setup/install-macos.sh --yes --emulator   + Android Studio 2025.1.4.8, emulator chain, web runtime (Apple Silicon only)
#   bash setup/install-macos.sh --yes --agent      + PICO plugin and knowledge MCP for Claude Code
#
# Idempotent: every step checks first and skips what is already there. Nothing is installed
# without --yes. Every command is cited in setup/DEPENDENCIES.md.

set -u
YES=0; EMU=0; AGENT=0
for a in "$@"; do case "$a" in --yes|-y) YES=1;; --emulator) EMU=1;; --agent) AGENT=1;; esac; done
KIT="$(cd "$(dirname "$0")/.." && pwd)"
PICO_HOME_DIR="${PICO_HOME:-$HOME/Library/PICO/sdk}"
STUDIO_DMG_URL="https://edgedl.me.gvt1.com/edgedl/android/studio/install/2025.1.4.8/android-studio-2025.1.4.8-mac_arm.dmg"
planned=0

c() { printf '\033[%sm%s\033[0m\n' "$1" "$2"; }
has() { command -v "$1" >/dev/null 2>&1; }

# step "title" "check-command" "shown-command" "run-command"
step() {
  if bash -c "$2" >/dev/null 2>&1; then c 90 "  [skip] $1"; return; fi
  planned=$((planned + 1))
  if [ "$YES" -ne 1 ]; then c 33 "  [todo] $1"; echo "         $3"; return; fi
  c 36 "  [run ] $1"; echo "         $3"
  bash -c "$4"
  hash -r
  if bash -c "$2" >/dev/null 2>&1; then c 32 "  [ ok ] $1"
  else c 31 "  [????] $1 ran but the check still fails. Open a NEW terminal and re-run; if it persists: node setup/doctor.mjs"; fi
}

node_ok='v=$(node --version 2>/dev/null) || exit 1; v=${v#v}; M=${v%%.*}; r=${v#*.}; m=${r%%.*}; [ "$M" -gt 22 ] || { [ "$M" -eq 22 ] && [ "$m" -ge 12 ]; } || { [ "$M" -eq 20 ] && [ "$m" -ge 19 ]; }'
pico_ok='pico-cli --version 2>/dev/null | grep -q "^pico-cli/"'
studio_ok='for p in "${ANDROID_STUDIO_PATH:-/nonexistent}" "/Applications/Android Studio.app" "$HOME/Applications/Android Studio.app" "$HOME/Applications/Android Studio 2025.1.app"; do f="$p/Contents/Resources/product-info.json"; [ -f "$f" ] && grep -q "2025\.1" "$f" && exit 0; done; exit 1'

[ "$(uname -s)" = "Darwin" ] || { echo "This is the macOS installer. On Windows use setup/install-windows.ps1; on Linux follow setup/SETUP.md (web-only track)."; exit 1; }
c 1 ""
c 1 "PICO WebSpatial Academy installer (macOS)"
[ "$YES" -ne 1 ] && c 33 "Dry run: nothing will be installed. Re-run with --yes to act."

if ! has brew; then
  c 31 "Homebrew is missing. Install it first (https://brew.sh):"
  echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  exit 1
fi
BREW_PREFIX="$(brew --prefix)"

c 1 ""; c 1 "== Core (everyone)"
step "Node.js 24 LTS (Vite 8 needs ^20.19 or >=22.12)" "$node_ok" \
  "brew install node@24 && echo 'export PATH=\"$BREW_PREFIX/opt/node@24/bin:\$PATH\"' >> ~/.zshrc" \
  "brew install node@24 && echo 'export PATH=\"$BREW_PREFIX/opt/node@24/bin:\$PATH\"' >> ~/.zshrc && export PATH=\"$BREW_PREFIX/opt/node@24/bin:\$PATH\""
export PATH="$BREW_PREFIX/opt/node@24/bin:$HOME/.local/bin:$PATH"
# On a fresh Mac `git --version` is a shim that pops Apple's install dialog; xcode-select -p is the silent check.
step "Git (Xcode Command Line Tools)" "xcode-select -p" "xcode-select --install" "xcode-select --install; echo 'Finish the Apple dialog, then re-run this script.'"
step "Claude Code (official native installer)" "command -v claude" "curl -fsSL https://claude.ai/install.sh | bash" "curl -fsSL https://claude.ai/install.sh | bash"
if has pico-cli && ! bash -c "$pico_ok"; then
  step "Remove the unrelated unscoped 'pico-cli' npm package" "$pico_ok" "npm uninstall -g pico-cli" "npm uninstall -g pico-cli"
fi
step "PICO CLI (@picoxr/pico-cli, NOT the unscoped pico-cli)" "$pico_ok" "npm install -g @picoxr/pico-cli" "npm install -g @picoxr/pico-cli"
# cd first: `npm --prefix labs install` from the kit root installs the kit INTO labs (file:.. + a recursive link).
step "Lab dependencies" "[ -d '$KIT/labs/node_modules' ]" "cd labs && npm install" "cd '$KIT/labs' && npm install"

if [ "$EMU" -eq 1 ]; then
  c 1 ""; c 1 "== PICO Emulator chain"
  if [ "$(uname -m)" != "arm64" ] && [ "$(sysctl -n hw.optional.arm64 2>/dev/null)" != "1" ]; then
    c 31 "  This is an Intel Mac. PICO: \"Intel chips are not supported\" for the emulator. You are on the web-only track."
  else
    c 35 "  The PICO Emulator and PICO WebSpatial browser are licensed by PICO; tonight's attendees are cleared by PICO for this workshop."
    c 35 "  pico-cli accepts the license on your behalf. Read it at https://developer.picoxr.com/document/distribute/sdk-license-terms/"
    # Side by side with any newer Android Studio, because PICO's plugin only loads in 2025.1.x.
    if [ -d "/Applications/Android Studio.app" ]; then DEST="$HOME/Applications/Android Studio 2025.1.app"; else DEST="/Applications/Android Studio.app"; fi
    step "Android Studio 2025.1.4.8 (PICO requires 2025.1.x exactly; brew's cask is newer and will NOT work)" "$studio_ok" \
      "curl -fL -o ~/Downloads/android-studio-2025.1.4.8-mac_arm.dmg $STUDIO_DMG_URL && copy the app to \"$DEST\"" \
      "set -e; curl -fL -C - -o ~/Downloads/android-studio-2025.1.4.8-mac_arm.dmg '$STUDIO_DMG_URL'; mnt=\$(hdiutil attach -nobrowse ~/Downloads/android-studio-2025.1.4.8-mac_arm.dmg | awk -F'\t' '/Volumes/{print \$NF}'); mkdir -p \"\$(dirname \"$DEST\")\"; cp -R \"\$mnt/Android Studio.app\" \"$DEST\"; hdiutil detach \"\$mnt\" >/dev/null"
    if [ "$DEST" != "/Applications/Android Studio.app" ]; then
      c 33 "  A different Android Studio owns /Applications/Android Studio.app, so point pico-cli at 2025.1:"
      echo "         echo 'export ANDROID_STUDIO_PATH=\"$DEST\"' >> ~/.zshrc && export ANDROID_STUDIO_PATH=\"$DEST\""
      [ "$YES" -eq 1 ] && ! grep -q ANDROID_STUDIO_PATH ~/.zshrc 2>/dev/null && echo "export ANDROID_STUDIO_PATH=\"$DEST\"" >> ~/.zshrc
      export ANDROID_STUDIO_PATH="$DEST"
    fi
    step "PICO Spatial plugin, Android SDK 35, Java, PICO_HOME, emulator bundle, AVD (fills only the gaps)" \
      "ls ~/.pico/avd/*.ini && ls -d ~/Library/Application\\ Support/Google/AndroidStudio*/plugins/* | grep -Eiq 'pico|spatial'" \
      "pico-cli emulator setup" "pico-cli emulator setup"
    step "PICO WebSpatial browser for 'pico-cli web launch' (336 MB, do this at home)" \
      "find '$PICO_HOME_DIR' -maxdepth 3 -name PicoBrowser.apk | grep -q ." "pico-cli web setup" "pico-cli web setup"
  fi
else
  c 90 ""; c 90 "== PICO Emulator chain: not requested (add --emulator). Without it you are on the web-only track."
fi

if [ "$AGENT" -eq 1 ]; then
  c 1 ""; c 1 "== Claude Code wiring"
  c 35 "  Close every other Claude Code window first: pico-cli setup kills running pico-dev-knowledge servers."  step "PICO plugin (skills) + pico-dev-knowledge MCP for Claude Code" \
    "grep -q 'pico-spatial-agentic-tools@' ~/.claude/plugins/installed_plugins.json" \
    "pico-cli setup --agent-tool claude-code --platform spatial --scope global --yes" \
    "pico-cli setup --agent-tool claude-code --platform spatial --scope global --yes"
else
  c 90 ""; c 90 "== Claude Code wiring: not requested (add --agent). Optional for the web labs."
fi

echo
[ "$YES" -ne 1 ] && c 33 "$planned step(s) to do. Re-run with --yes to apply them."
if has node; then
  c 1 ""; c 1 "Doctor:"
  if [ "$EMU" -eq 1 ]; then node "$KIT/setup/doctor.mjs" --quick; else node "$KIT/setup/doctor.mjs" --quick --web-only; fi
fi
