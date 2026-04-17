#!/usr/bin/env bash
# Launchd entry point for the swarm mission.
# Invoked by ~/Library/LaunchAgents/com.circlo.swarm-mission.plist
# on its schedule. Runs the wrapper and redirects output to a log file.

set -o pipefail

REPO_DIR="/Users/guyavnaim/Desktop/circlo/APP-CAPACITOR (circlo-mobile)"
LOG_DIR="$REPO_DIR/scripts/logs"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/swarm-run-$TIMESTAMP.log"

mkdir -p "$LOG_DIR"

{
  echo "──────────────────────────────────────────────"
  echo "Swarm cron starting at $(date -Iseconds)"
  echo "Repo: $REPO_DIR"
  echo "PATH: $PATH"
  echo "──────────────────────────────────────────────"

  cd "$REPO_DIR" || {
    echo "FATAL: cannot cd to $REPO_DIR"
    exit 1
  }

  # Resolve node + npx. Launchd has a minimal PATH; check common locations.
  if ! command -v npx >/dev/null 2>&1; then
    for candidate in \
      "$HOME/.local/bin/npx" \
      "/usr/local/bin/npx" \
      "/opt/homebrew/bin/npx" \
      "/usr/bin/npx"; do
      if [ -x "$candidate" ]; then
        export PATH="$(dirname "$candidate"):$PATH"
        break
      fi
    done
  fi

  if ! command -v npx >/dev/null 2>&1; then
    echo "FATAL: npx not found on PATH: $PATH"
    exit 1
  fi

  echo "npx resolved: $(which npx)"
  echo "node version: $(node --version 2>&1)"
  echo "claude resolved: $(which claude 2>&1)"
  echo ""

  # Run the wrapper. This spawns the Queen, manages the staging branch,
  # and updates dev_missions. The wrapper's own logging is verbose.
  npx --yes tsx scripts/swarm-mission.ts
  EXIT=$?

  echo ""
  echo "──────────────────────────────────────────────"
  echo "Swarm cron finished at $(date -Iseconds) (exit=$EXIT)"
  echo "──────────────────────────────────────────────"

  exit $EXIT
} 2>&1 | tee -a "$LOG_FILE"
