#!/bin/bash
# Dispatch a coding task to the Claude CLI agent server
# Usage: ./dispatch-task.sh "task description" [agent-name] [/path/to/repo]

TASK="${1:?Usage: dispatch-task.sh \"task description\" [agent] [repo]}"
AGENT="${2:-dev}"
REPO="${3:-/Users/openclaw/Projects/supabase-starter-kit}"
SERVER="http://localhost:18792"

# Submit the task
echo "Dispatching task to agent '$AGENT'..."
RESPONSE=$(curl -s -X POST "$SERVER/execute-task" \
  -H "Content-Type: application/json" \
  -d "{\"task\": $(echo "$TASK" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().strip()))'), \"agent\": \"$AGENT\", \"repo\": \"$REPO\"}")

JOB_ID=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['jobId'])" 2>/dev/null)

if [ -z "$JOB_ID" ]; then
  echo "Error submitting task:"
  echo "$RESPONSE"
  exit 1
fi

echo "Job submitted: $JOB_ID"
echo "Polling for completion..."

# Poll until done
while true; do
  STATUS_RESPONSE=$(curl -s "$SERVER/task-status/$JOB_ID")
  STATUS=$(echo "$STATUS_RESPONSE" | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['status'])" 2>/dev/null)

  case "$STATUS" in
    completed)
      echo ""
      echo "Task completed!"
      echo "$STATUS_RESPONSE" | python3 -c "
import json, sys
j = json.loads(sys.stdin.read())
print(f\"Summary: {j.get('summary', 'N/A')}\")
print(f\"Commit:  {j.get('commitHash', 'none')}\")
print(f\"Time:    {j.get('startedAt', '')} → {j.get('completedAt', '')}\")
"
      exit 0
      ;;
    failed)
      echo ""
      echo "Task failed!"
      echo "$STATUS_RESPONSE" | python3 -c "import json,sys; print(json.loads(sys.stdin.read()).get('error','Unknown error'))"
      exit 1
      ;;
    running|queued)
      printf "."
      sleep 5
      ;;
    *)
      echo "Unknown status: $STATUS"
      echo "$STATUS_RESPONSE"
      exit 1
      ;;
  esac
done
