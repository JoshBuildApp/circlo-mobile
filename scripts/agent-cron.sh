#!/bin/bash
# ============================================================
# Circlo Agent Cron — Autonomous Task Runner
# Fetches pending tasks, runs Claude to complete them,
# and auto-updates task status on completion.
# Schedule with crontab or launchd.
# ============================================================

set -euo pipefail

PROJECT_DIR="/Users/openclaw/Projects/supabase-starter-kit"
LOG_DIR="$PROJECT_DIR/scripts/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/cron-$TIMESTAMP.log"
SCRIPTS_DIR="$PROJECT_DIR/scripts"

SUPABASE_URL="https://rsevfeogormnorvcvxio.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZXZmZW9nb3Jtbm9ydmN2eGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzQyNTEsImV4cCI6MjA5MDk1MDI1MX0.QnP03Rz5r8i6qDq64hOA06J_2PtqH9Ybrv70DyRP_sM"

mkdir -p "$LOG_DIR"

log() {
  echo "$(date): $1" >> "$LOG_FILE"
}

log "═══ Agent Cron starting ═══"

cd "$PROJECT_DIR"
git pull --rebase >> "$LOG_FILE" 2>&1 || log "WARNING: git pull failed"

# ──────────────────────────────────────
# Fetch pending/in_progress tasks
# ──────────────────────────────────────
TASKS_JSON=$(curl -s \
  "$SUPABASE_URL/rest/v1/agent_tasks?status=in.(pending,in_progress)&order=created_at.asc" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY")

TASK_COUNT=$(echo "$TASKS_JSON" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

if [ "$TASK_COUNT" = "0" ]; then
  log "No pending tasks. Checking for stale in_progress tasks..."

  # Auto-complete stale in_progress tasks that have matching recent commits
  STALE_JSON=$(curl -s \
    "$SUPABASE_URL/rest/v1/agent_tasks?status=eq.in_progress&order=created_at.asc" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY")

  STALE_COUNT=$(echo "$STALE_JSON" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

  if [ "$STALE_COUNT" != "0" ]; then
    log "Found $STALE_COUNT stale in_progress tasks. Checking git for completions..."
    RECENT_COMMITS=$(git log --oneline -20 --format="%s")

    echo "$STALE_JSON" | python3 -c "
import sys, json
tasks = json.load(sys.stdin)
for t in tasks:
    print(t['id'] + '|' + t.get('title', ''))
" 2>/dev/null | while IFS='|' read -r TASK_ID TASK_TITLE; do
      # Check if any recent commit mentions keywords from the task title
      TITLE_LOWER=$(echo "$TASK_TITLE" | tr '[:upper:]' '[:lower:]')
      MATCH=$(echo "$RECENT_COMMITS" | tr '[:upper:]' '[:lower:]' | grep -c "$TITLE_LOWER" || true)
      if [ "$MATCH" -gt 0 ]; then
        log "Auto-completing stale task: $TASK_TITLE ($TASK_ID)"
        bash "$SCRIPTS_DIR/update-task-status.sh" "$TASK_ID" completed "Auto-completed: matching commit found"
      fi
    done
  fi

  log "═══ Agent Cron finished (no work) ═══"
  exit 0
fi

log "Found $TASK_COUNT task(s) to process"

# ──────────────────────────────────────
# Build task list for the agent prompt
# ──────────────────────────────────────
TASK_LIST=$(echo "$TASKS_JSON" | python3 -c "
import sys, json
tasks = json.load(sys.stdin)
for t in tasks:
    pri = t.get('priority', 'medium').upper()
    status = t.get('status', 'pending')
    icon = '🔄' if status == 'in_progress' else '⏳'
    print(f\"{icon} [{pri}] {t['title']}\")
    if t.get('description'):
        print(f\"   {t['description']}\")
    print(f\"   ID: {t['id']}\")
    print()
" 2>/dev/null)

log "Task list built. Launching Claude..."

# ──────────────────────────────────────
# Build agent prompt with task context
# ──────────────────────────────────────
AGENT_PROMPT="You are Dev, an autonomous AI agent working on Circlo. You are running headlessly — no human is watching. Do your work silently and efficiently.

## Active Tasks
$TASK_LIST

## Your Mission
1. For each task above, pick the HIGHEST priority one first.
2. Update the task status to in_progress:
   bash $SCRIPTS_DIR/update-task-status.sh <task-id> in_progress \"Starting: <task title>\"
3. DO THE WORK — read the relevant files, write code, fix bugs, whatever the task requires.
4. After making changes, run: npm run build — to verify nothing is broken.
5. Log your work: npx tsx scripts/agent-log-activity.ts file_change \"Description of what you did\" <task-id>
6. If the build passes, commit the changes with a clear message.
7. Mark the task completed:
   bash $SCRIPTS_DIR/update-task-status.sh <task-id> completed \"Completed: <brief summary>\"
8. Move on to the NEXT task and repeat.
9. Continue until ALL tasks are done or you hit a blocker.

## CRITICAL: Always update task status!
- Starting a task → bash $SCRIPTS_DIR/update-task-status.sh <task-id> in_progress
- Task done → bash $SCRIPTS_DIR/update-task-status.sh <task-id> completed
- Task blocked → bash $SCRIPTS_DIR/update-task-status.sh <task-id> blocked \"Reason\"
- Task failed → bash $SCRIPTS_DIR/update-task-status.sh <task-id> failed \"Reason\"

## If Blocked
- Mark blocked: bash $SCRIPTS_DIR/update-task-status.sh <task-id> blocked \"<reason>\"
- Log why: npx tsx scripts/agent-log-activity.ts error \"Blocked: <reason>\" <task-id>
- Move on to the next task.

## Rules
- Follow Circlo coding conventions (CLAUDE.md)
- Always use @/ imports, Tailwind classes, cn() helper
- Never edit src/integrations/supabase/types.ts
- Never edit src/components/ui/ unless fixing a bug
- Handle all Supabase errors
- Run npm run build after every change
- Only commit if the build passes
- Do NOT push to remote — just commit locally"

# Run Claude Code
claude -p "$AGENT_PROMPT" \
  --allowedTools Edit,Write,Bash,Read,Glob,Grep \
  --max-turns 50 \
  --output-format text \
  >> "$LOG_FILE" 2>&1

EXIT_CODE=$?
log "Claude finished with exit code $EXIT_CODE"

# ──────────────────────────────────────
# Post-run: Auto-complete any remaining in_progress tasks
# that now have matching commits
# ──────────────────────────────────────
log "Post-run: checking for tasks to auto-complete..."

REMAINING_JSON=$(curl -s \
  "$SUPABASE_URL/rest/v1/agent_tasks?status=eq.in_progress&order=created_at.asc" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY")

REMAINING_COUNT=$(echo "$REMAINING_JSON" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

if [ "$REMAINING_COUNT" != "0" ]; then
  RECENT_COMMITS=$(git log --oneline -20 --format="%s")

  echo "$REMAINING_JSON" | python3 -c "
import sys, json
tasks = json.load(sys.stdin)
for t in tasks:
    print(t['id'] + '|' + t.get('title', ''))
" 2>/dev/null | while IFS='|' read -r TASK_ID TASK_TITLE; do
    TITLE_LOWER=$(echo "$TASK_TITLE" | tr '[:upper:]' '[:lower:]')
    MATCH=$(echo "$RECENT_COMMITS" | tr '[:upper:]' '[:lower:]' | grep -c "$TITLE_LOWER" || true)
    if [ "$MATCH" -gt 0 ]; then
      log "Auto-completing: $TASK_TITLE ($TASK_ID)"
      bash "$SCRIPTS_DIR/update-task-status.sh" "$TASK_ID" completed "Auto-completed after cron run: matching commit found"
    fi
  done
fi

log "═══ Agent Cron finished ═══"

# Clean up old logs (keep last 30)
ls -t "$LOG_DIR"/cron-*.log 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null

exit $EXIT_CODE
