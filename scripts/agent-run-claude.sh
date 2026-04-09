#!/bin/bash
# Run a task through Claude Code CLI (uses Guy's Max plan - free!)
# Usage: ./agent-run-claude.sh "task prompt" agent_name task_id

PROMPT="$1"
AGENT_NAME="$2"
TASK_ID="$3"
PROJECT_DIR="/Users/openclaw/Projects/supabase-starter-kit"

cd "$PROJECT_DIR"

# Run through Claude Code CLI
RESULT=$(claude -p "$PROMPT" --output-format text 2>&1)
EXIT_CODE=$?

echo "$RESULT"
exit $EXIT_CODE
