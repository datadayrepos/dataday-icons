#!/usr/bin/env bash

RELEASE_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)" || exit 1
cd "$RELEASE_ROOT" || exit 1
# Release actions must use this checkout, never the caller's working directory.
release_require_main() {
    local root="$1" actual branch
    actual="$(git -C "$root" rev-parse --show-toplevel 2>/dev/null)" || {
        printf 'ERROR: Release requires a Git repository at %s.\n' "$root" >&2
        exit 1
    }
    branch="$(git -C "$root" symbolic-ref --quiet --short HEAD 2>/dev/null)" || branch="DETACHED HEAD"
    if [[ "$actual" != "$root" || "$branch" != main ]]; then
        printf 'ERROR: Release requires main at %s (actual root: %s; branch: %s). No automatic branch repair.\n' "$root" "$actual" "$branch" >&2
        exit 1
    fi
    cd "$root" || exit 1
}

set -euo pipefail

#   chmod +x shell/deploy.sh
#   ./shell/deploy.sh

# -----------------------------
# Paths / repo root
# -----------------------------
SCRIPT_DIR="$RELEASE_ROOT/shell"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PKG_JSON="$ROOT_DIR/package.json"

cd "$ROOT_DIR"

# -----------------------------
# Colors
# -----------------------------
if [[ -t 1 ]]; then
  C_RESET=$'\033[0m'
  C_BOLD=$'\033[1m'
  C_DIM=$'\033[2m'
  C_RED=$'\033[31m'
  C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'
  C_BLUE=$'\033[34m'
  C_CYAN=$'\033[36m'
else
  C_RESET="" C_BOLD="" C_DIM="" C_RED="" C_GREEN="" C_YELLOW="" C_BLUE="" C_CYAN=""
fi

die() { echo "${C_RED}error:${C_RESET} $*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

banner() {
  echo
  echo "${C_BOLD}${C_CYAN}deploy.sh${C_RESET} ${C_DIM}(repo: $ROOT_DIR)${C_RESET}"
  echo "${C_DIM}----------------------------------------${C_RESET}"
}

pause() {
  echo
  read -r -p "Press Enter to continue..." _
}

prompt_yn() {
  local q="${1:-Continue?}"
  local def="${2:-y}"
  local hint
  if [[ "$def" == "y" ]]; then hint="[Y/n]"; else hint="[y/N]"; fi

  while true; do
    read -r -p "${q} ${hint} " ans
    ans="${ans:-$def}"
    case "$ans" in
      y|Y|yes|YES) return 0 ;;
      n|N|no|NO) return 1 ;;
      *) echo "Please answer y or n." ;;
    esac
  done
}

# Switched from require() to fs.readFileSync to bypass ESM/CJS interop issues
pkg_field() {
  node -p "const fs = require('fs'); const p = JSON.parse(fs.readFileSync('$PKG_JSON', 'utf8')); p['$1'] ?? ''"
}

# Switched from require() to fs.readFileSync
pkg_script_exists() {
  node -p "const fs = require('fs'); const p = JSON.parse(fs.readFileSync('$PKG_JSON', 'utf8')); !!(p.scripts && p.scripts['$1'])"
}

current_branch() {
  git rev-parse --abbrev-ref HEAD 2>/dev/null || echo ""
}

# -----------------------------
# Version bump (package.json only)
# -----------------------------
BUMPED="0"

bump_version() {
    release_require_main "$RELEASE_ROOT"
  [[ -f "$PKG_JSON" ]] || die "package.json not found at $PKG_JSON"

  local name version
  name="$(pkg_field name)"
  version="$(pkg_field version)"
  [[ -n "$version" ]] || die "package.json has no version field"

  echo
  echo "${C_BOLD}Package:${C_RESET} ${name:-"(unknown)"}"
  echo "${C_BOLD}Version:${C_RESET} $version"
  echo

  echo "Bump version?"
  echo "  ${C_GREEN}p${C_RESET}) patch"
  echo "  ${C_YELLOW}m${C_RESET}) minor"
  echo "  ${C_RED}M${C_RESET}) major"
  echo "  ${C_DIM}n${C_RESET}) no"
  while true; do
    read -r -p "Choose [p/m/M/n] (default: n): " choice
    choice="${choice:-n}"
    case "$choice" in
      p|m|M|n) break ;;
      *) echo "Please choose p, m, M, or n." ;;
    esac
  done

  if [[ "$choice" == "n" ]]; then
    echo "${C_DIM}Skipping version bump.${C_RESET}"
    return 1
  fi

  local bump_type
  case "$choice" in
    p) bump_type="patch" ;;
    m) bump_type="minor" ;;
    M) bump_type="major" ;;
  esac

  local new_version
  # FIX: Added '-' after --input-type=commonjs to correctly signal stdin script input
  release_require_main "$RELEASE_ROOT"
  new_version="$(node --input-type=commonjs - "$PKG_JSON" "$bump_type" <<'NODE'
const fs = require('fs');

const path = process.argv[2];
const bump = process.argv[3];

const raw = fs.readFileSync(path, 'utf8');
const pkg = JSON.parse(raw);

const v = String(pkg.version || '');
const core = v.split('-')[0]; // drop prerelease if present
const m = core.match(/^(\d+)\.(\d+)\.(\d+)$/);

if (!m) {
  console.error("Unsupported version format (expected x.y.z): " + v);
  process.exit(2);
}

let major = Number(m[1]);
let minor = Number(m[2]);
let patch = Number(m[3]);

if (bump === 'major') {
  major += 1; minor = 0; patch = 0;
} else if (bump === 'minor') {
  minor += 1; patch = 0;
} else if (bump === 'patch') {
  patch += 1;
} else {
  console.error("Unknown bump type: " + bump);
  process.exit(2);
}

const next = `${major}.${minor}.${patch}`;
pkg.version = next;

fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n", 'utf8');
process.stdout.write(next);
NODE
)" || die "version bump failed"

  echo "${C_GREEN}Bumped:${C_RESET} $version -> ${C_BOLD}$new_version${C_RESET}"
  BUMPED="1"
  return 0
}

# -----------------------------
# Build
# -----------------------------
maybe_build() {
  if prompt_yn "Run pnpm build first?" "y"; then
    echo
    echo "${C_BLUE}Running:${C_RESET} pnpm build"
    release_require_main "$RELEASE_ROOT"
    pnpm build
    echo "${C_GREEN}Build OK.${C_RESET}"
  else
    echo "${C_DIM}Skipping build.${C_RESET}"
  fi
}

# -----------------------------
# Git
# -----------------------------
git_commit_push() {
    release_require_main "$RELEASE_ROOT"
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not inside a git repo"

  local branch
  branch="$(current_branch)"
  [[ -n "$branch" ]] || die "could not determine current branch"

  echo
  echo "${C_BOLD}Git:${C_RESET} status"
  git status --short

  if [[ "$BUMPED" == "1" ]]; then
    if prompt_yn "We bumped package.json. Stage it now (git add package.json)?" "y"; then
      release_require_main "$RELEASE_ROOT"
      git add package.json
    fi
  fi

  if prompt_yn "Stage all changes (git add -A)?" "y"; then
    release_require_main "$RELEASE_ROOT"
    git add -A
  fi

  if git diff --cached --quiet; then
    echo "${C_DIM}No staged changes to commit.${C_RESET}"
  else
    local version msg input
    version="$(pkg_field version 2>/dev/null || true)"
    msg="chore(release): v${version:-"unknown"}"

    echo
    read -r -p "Commit message (default: \"$msg\"): " input
    input="${input:-$msg}"

    echo "${C_BLUE}Committing:${C_RESET} $input"
    release_require_main "$RELEASE_ROOT"
    git commit -m "$input"
  fi

  echo
  echo "${C_BLUE}Pushing:${C_RESET} origin $branch"
  release_require_main "$RELEASE_ROOT"
  git push origin "HEAD:refs/heads/main"
  echo "${C_GREEN}Git push OK.${C_RESET}"
}

# -----------------------------
# NPM publish
# -----------------------------
npm_login_if_needed() {
  if npm whoami >/dev/null 2>&1; then
    echo "${C_GREEN}NPM:${C_RESET} already logged in as $(npm whoami 2>/dev/null || true)"
    return 0
  fi

  echo
  echo "${C_YELLOW}NPM login required.${C_RESET}"
  echo "${C_DIM}Running: npm login${C_RESET}"
  npm login
}

npm_publish() {
    release_require_main "$RELEASE_ROOT"
  [[ -f "$PKG_JSON" ]] || die "package.json not found at $PKG_JSON"

  local priv has_pub
  priv="$(pkg_field private)"
  has_pub="$(pkg_script_exists pub)"

  if [[ "$priv" == "true" ]]; then
    die "package.json is private=true; refusing to publish"
  fi

  # The explicit npm action publishes only a freshly verified archive.
  release_require_main "$RELEASE_ROOT"
  pnpm -s run pack:release
  npm_login_if_needed

  echo
  if [[ "$has_pub" == "true" ]]; then
    echo "${C_BLUE}Publishing:${C_RESET} pnpm run pub  ${C_DIM}(from package.json scripts.pub)${C_RESET}"
    release_require_main "$RELEASE_ROOT"
    pnpm -s run pub
  else
    echo "${C_BLUE}Publishing:${C_RESET} npm publish --access restricted"
    release_require_main "$RELEASE_ROOT"
    npm publish --access restricted
  fi

  echo "${C_GREEN}NPM publish OK.${C_RESET}"
}

# -----------------------------
# Preflight
# -----------------------------
preflight() {
    release_require_main "$RELEASE_ROOT"
  BUMPED="0"
  bump_version || true
  maybe_build
}

# -----------------------------
# Menu actions
# -----------------------------
do_git_only() { preflight; git_commit_push; }
do_npm_only() { preflight; npm_publish; }
do_git_and_npm() { preflight; git_commit_push; npm_publish; }

# -----------------------------
# Main menu
# -----------------------------
main_menu() {
  while true; do
    banner

    local name ver
    name="$(pkg_field name 2>/dev/null || true)"
    ver="$(pkg_field version 2>/dev/null || true)"

    echo "${C_DIM}Package:${C_RESET} ${C_BOLD}${name:-"(unknown)"}${C_RESET} ${C_DIM}v${ver:-"?"}${C_RESET}"
    echo
    echo "  ${C_CYAN}1${C_RESET}) Git: commit + push"
    echo "  ${C_CYAN}2${C_RESET}) NPM: login + publish"
    echo "  ${C_CYAN}3${C_RESET}) Git + NPM (combined)"
    echo "  ${C_CYAN}q${C_RESET}) Quit"
    echo

    read -r -p "Choose: " choice
    case "$choice" in
      1) do_git_only; pause ;;
      2) do_npm_only; pause ;;
      3) do_git_and_npm; pause ;;
      q|Q) echo "Bye."; exit 0 ;;
      *) echo "Unknown choice: $choice"; pause ;;
    esac
  done
}

# -----------------------------
# Checks
# -----------------------------
need_cmd node
need_cmd git
need_cmd npm
need_cmd pnpm

main_menu
