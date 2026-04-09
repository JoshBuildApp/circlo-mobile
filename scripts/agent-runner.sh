#!/bin/bash
# ============================================================
# Circlo Autonomous Agent Runner
# Runs Claude Code headlessly to check for and complete tasks
# Schedule this with launchd to run at night automatically
# ============================================================

set -e

# Config
PROJECT_DIR="/Users/guyavnaim/Desktop/circlo"
CLAUDE_BIN=$(find "/Users/guyavnaim/Library/Application Support/Claude/claude-code" -name "claude" -path "*/MacOS/*" 2>/dev/null | sort -V | tail -1)
LOG_DIR="$PROJECT_DIR/scripts/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/agent-run-$TIMESTAMP.log"

# Ensure paths
export PATH="/Users/guyavnaim/.local/bin:$PATH"
mkdir -p "$LOG_DIR"

# Check Claude binary exists
if [ -z "$CLAUDE_BIN" ] || [ ! -f "$CLAUDE_BIN" ]; then
  echo "$(date): ERROR — Claude Code binary not found" >> "$LOG_FILE"
  exit 1
fi

echo "$(date): Agent runner starting" >> "$LOG_FILE"
echo "$(date): Using Claude at: $CLAUDE_BIN" >> "$LOG_FILE"
echo "$(date): Project: $PROJECT_DIR" >> "$LOG_FILE"

# The prompt that tells the agent what to do
AGENT_PROMPT='You are Dev, an autonomous AI agent working on Circlo. You are running headlessly — no human is watching. Do your work silently and efficiently.

## Your Mission
1. Check for pending tasks by running: npx tsx scripts/agent-check-tasks.ts
2. If there are NO pending tasks, log "No tasks found" and exit cleanly.
3. If there ARE pending tasks, pick the HIGHEST priority one.
4. Update the task status to in_progress: npx tsx scripts/agent-update-task.ts <task-id> in_progress
5. DO THE WORK — read the relevant files, write code, fix bugs, whatever the task requires.
6. After making changes, run: npm run build — to verify nothing is broken.
7. Log your work: npx tsx scripts/agent-log-activity.ts file_change "Description of what you did" <task-id>
8. If the build passes, commit the changes with a clear message.
9. Log the build result: npx tsx scripts/agent-log-health.ts build pass
10. Mark the task completed: npx tsx scripts/agent-update-task.ts <task-id> completed
11. Log completion: npx tsx scripts/agent-log-activity.ts commit "Completed: <task title>" <task-id>
12. Check for the NEXT pending task and repeat from step 3.
13. Continue until ALL pending tasks are done or you hit a blocker.

## If Blocked
- If you cannot complete a task, mark it blocked: npx tsx scripts/agent-update-task.ts <task-id> blocked
- Log why: npx tsx scripts/agent-log-activity.ts error "Blocked: <reason>" <task-id>
- Move on to the next task.

## CRITICAL: Always update task status!
After completing each task, run:
  bash /Users/openclaw/Projects/supabase-starter-kit/scripts/update-task-status.sh <task-id> completed "Completed: <brief summary>"
When starting a task:
  bash /Users/openclaw/Projects/supabase-starter-kit/scripts/update-task-status.sh <task-id> in_progress "Starting: <task title>"
If blocked:
  bash /Users/openclaw/Projects/supabase-starter-kit/scripts/update-task-status.sh <task-id> blocked "<reason>"

## Rules
- Follow Circlo coding conventions (CLAUDE.md)
- Always use @/ imports, Tailwind classes, cn() helper
- Never edit src/integrations/supabase/types.ts
- Never edit src/components/ui/ unless fixing a bug
- Handle all Supabase errors
- Run npm run build after every change
- Only commit if the build passes
- Do NOT push to remote — just commit locally

## Important
- You are running autonomously. Do not ask questions. Make decisions.
- If a task is ambiguous, do your best interpretation.
- Log everything you do to agent_activity so Guy can see it on the dashboard.
- Work through ALL tasks, one by one, until none are left.'

# Run Claude Code headlessly
echo "$(date): Launching Claude Code..." >> "$LOG_FILE"

cd "$PROJECT_DIR"
"$CLAUDE_BIN" -p "$AGENT_PROMPT" \
  --allowedTools Edit,Write,Bash,Read,Glob,Grep \
  --max-turns 50 \
  --output-format text \
  >> "$LOG_FILE" 2>&1

EXIT_CODE=$?
echo "$(date): Agent runner finished with exit code $EXIT_CODE" >> "$LOG_FILE"

# Clean up old logs (keep last 30)
ls -t "$LOG_DIR"/agent-run-*.log 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null

exit $EXIT_CODE
