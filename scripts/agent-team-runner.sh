#!/bin/bash
# ============================================================
# Circlo Agent Team Runner — Master Orchestrator
#
# Runs the full agent team in sequence:
# 1. Dev (Lead) — delegates tasks to the right agents
# 2. Pixel — works on UI/design tasks
# 3. Shield — works on security tasks
# 4. Pulse — tests everything, validates builds
#
# Schedule this with launchd to run at night.
# ============================================================

set -e

PROJECT_DIR="/Users/guyavnaim/Desktop/circlo"
CLAUDE_BIN=$(find "/Users/guyavnaim/Library/Application Support/Claude/claude-code" -name "claude" -path "*/MacOS/*" 2>/dev/null | sort -V | tail -1)
LOG_DIR="$PROJECT_DIR/scripts/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
AGENTS_DIR="$PROJECT_DIR/scripts/agents"

export PATH="/Users/guyavnaim/.local/bin:$PATH"
mkdir -p "$LOG_DIR"

if [ -z "$CLAUDE_BIN" ] || [ ! -f "$CLAUDE_BIN" ]; then
  echo "$(date): ERROR — Claude Code binary not found" >> "$LOG_DIR/team-$TIMESTAMP.log"
  exit 1
fi

cd "$PROJECT_DIR"

# ──────────────────────────────────────
# PHASE 1: Dev (Team Lead) — Delegates
# ──────────────────────────────────────
echo "$(date): ═══ PHASE 1: Dev (Team Lead) starting ═══" >> "$LOG_DIR/team-$TIMESTAMP.log"

DEV_PROMPT=$(cat "$AGENTS_DIR/dev-prompt.md")
DEV_PROMPT="$DEV_PROMPT

AUTONOMOUS RUN — $(date)
Check all pending tasks. Delegate UI tasks to Pixel (ID: f3849ab1-3af9-41df-ada9-adbacd910bba), security tasks to Shield (ID: 622ecdcc-05ce-49b9-8f12-ef5a06965b99), QA tasks to Pulse (ID: 793a9c5b-fcb8-44a8-b744-c96258364024). Keep complex full-stack tasks for yourself (ID: c8fe9102-9a21-4612-be79-de149730b9ff).

After delegating, work on YOUR tasks until they are all done. Do not stop until your tasks are complete or blocked.

CRITICAL: After completing each task, update its status:
  bash $PROJECT_DIR/scripts/update-task-status.sh <task-id> completed \"Completed: <summary>\"
When starting a task:
  bash $PROJECT_DIR/scripts/update-task-status.sh <task-id> in_progress \"Starting: <title>\"
If blocked:
  bash $PROJECT_DIR/scripts/update-task-status.sh <task-id> blocked \"<reason>\""

"$CLAUDE_BIN" -p "$DEV_PROMPT" \
  --allowedTools Edit,Write,Bash,Read,Glob,Grep \
  --max-turns 50 \
  --output-format text \
  >> "$LOG_DIR/dev-$TIMESTAMP.log" 2>&1

echo "$(date): Dev finished" >> "$LOG_DIR/team-$TIMESTAMP.log"

# ──────────────────────────────────────
# PHASE 2: Pixel (Designer) — Builds UI
# ──────────────────────────────────────
echo "$(date): ═══ PHASE 2: Pixel (Designer) starting ═══" >> "$LOG_DIR/team-$TIMESTAMP.log"

PIXEL_PROMPT=$(cat "$AGENTS_DIR/pixel-prompt.md")
PIXEL_PROMPT="$PIXEL_PROMPT

AUTONOMOUS RUN — $(date)
Your agent ID is: f3849ab1-3af9-41df-ada9-adbacd910bba
Check agent_tasks for tasks assigned to you (assigned_to = your ID). Work through ALL of them until done. Do not stop until every assigned task is complete or blocked.

CRITICAL: After completing each task, update its status:
  bash $PROJECT_DIR/scripts/update-task-status.sh <task-id> completed \"Completed: <summary>\"
If blocked:
  bash $PROJECT_DIR/scripts/update-task-status.sh <task-id> blocked \"<reason>\""

"$CLAUDE_BIN" -p "$PIXEL_PROMPT" \
  --allowedTools Edit,Write,Bash,Read,Glob,Grep \
  --max-turns 50 \
  --output-format text \
  >> "$LOG_DIR/pixel-$TIMESTAMP.log" 2>&1

echo "$(date): Pixel finished" >> "$LOG_DIR/team-$TIMESTAMP.log"

# ──────────────────────────────────────
# PHASE 3: Shield (Security) — Hardens
# ──────────────────────────────────────
echo "$(date): ═══ PHASE 3: Shield (Security) starting ═══" >> "$LOG_DIR/team-$TIMESTAMP.log"

SHIELD_PROMPT=$(cat "$AGENTS_DIR/shield-prompt.md")
SHIELD_PROMPT="$SHIELD_PROMPT

AUTONOMOUS RUN — $(date)
Your agent ID is: 622ecdcc-05ce-49b9-8f12-ef5a06965b99
Check agent_tasks for tasks assigned to you (assigned_to = your ID). Work through ALL of them until done. Do not stop until every assigned task is complete or blocked.

CRITICAL: After completing each task, update its status:
  bash $PROJECT_DIR/scripts/update-task-status.sh <task-id> completed \"Completed: <summary>\"
If blocked:
  bash $PROJECT_DIR/scripts/update-task-status.sh <task-id> blocked \"<reason>\""

"$CLAUDE_BIN" -p "$SHIELD_PROMPT" \
  --allowedTools Edit,Write,Bash,Read,Glob,Grep \
  --max-turns 50 \
  --output-format text \
  >> "$LOG_DIR/shield-$TIMESTAMP.log" 2>&1

echo "$(date): Shield finished" >> "$LOG_DIR/team-$TIMESTAMP.log"

# ──────────────────────────────────────
# PHASE 4: Pulse (QA) — Tests Everything
# ──────────────────────────────────────
echo "$(date): ═══ PHASE 4: Pulse (QA) starting ═══" >> "$LOG_DIR/team-$TIMESTAMP.log"

PULSE_PROMPT=$(cat "$AGENTS_DIR/pulse-prompt.md")
PULSE_PROMPT="$PULSE_PROMPT

AUTONOMOUS RUN — $(date)
Your agent ID is: 793a9c5b-fcb8-44a8-b744-c96258364024
First: run npm run build and npm run lint — log the results.
Then: check agent_tasks for tasks assigned to you. Work through ALL of them.
Finally: review recent git changes from Dev, Pixel, and Shield. Run a final build to make sure nothing is broken.
Do not stop until everything passes.

CRITICAL: After completing each task, update its status:
  bash $PROJECT_DIR/scripts/update-task-status.sh <task-id> completed \"Completed: <summary>\"
If blocked:
  bash $PROJECT_DIR/scripts/update-task-status.sh <task-id> blocked \"<reason>\""

"$CLAUDE_BIN" -p "$PULSE_PROMPT" \
  --allowedTools Edit,Write,Bash,Read,Glob,Grep \
  --max-turns 50 \
  --output-format text \
  >> "$LOG_DIR/pulse-$TIMESTAMP.log" 2>&1

echo "$(date): Pulse finished" >> "$LOG_DIR/team-$TIMESTAMP.log"

# ──────────────────────────────────────
# DONE
# ──────────────────────────────────────
echo "$(date): ═══ ALL AGENTS COMPLETE ═══" >> "$LOG_DIR/team-$TIMESTAMP.log"

# Clean up old logs (keep last 20 runs)
for prefix in team dev pixel shield pulse; do
  ls -t "$LOG_DIR"/${prefix}-*.log 2>/dev/null | tail -n +21 | xargs rm -f 2>/dev/null
done
