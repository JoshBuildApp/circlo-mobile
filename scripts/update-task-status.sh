#!/bin/bash
# ============================================================
# Quick Task Status Updater (shell version)
# Usage: ./update-task-status.sh <task-id> <status> [summary]
# Status: completed, failed, in_progress, blocked, pending
# ============================================================

TASK_ID=$1
STATUS=$2
SUMMARY=${3:-"Task marked $STATUS"}

if [ -z "$TASK_ID" ] || [ -z "$STATUS" ]; then
  echo "Usage: ./update-task-status.sh <task-id> <status> [summary]"
  exit 1
fi

SUPABASE_URL="https://rsevfeogormnorvcvxio.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZXZmZW9nb3Jtbm9ydmN2eGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzQyNTEsImV4cCI6MjA5MDk1MDI1MX0.QnP03Rz5r8i6qDq64hOA06J_2PtqH9Ybrv70DyRP_sM"
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Build JSON payload
if [ "$STATUS" = "completed" ]; then
  PAYLOAD="{\"status\": \"$STATUS\", \"completed_at\": \"$NOW\", \"updated_at\": \"$NOW\"}"
else
  PAYLOAD="{\"status\": \"$STATUS\", \"updated_at\": \"$NOW\"}"
fi

# Update the task
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PATCH "$SUPABASE_URL/rest/v1/agent_tasks?id=eq.$TASK_ID" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "$PAYLOAD")

if [ "$RESPONSE" -ge 200 ] && [ "$RESPONSE" -lt 300 ]; then
  echo "✅ Task $TASK_ID → $STATUS"
else
  echo "❌ Failed to update task $TASK_ID (HTTP $RESPONSE)"
  exit 1
fi

# Log the activity
curl -s -o /dev/null \
  -X POST "$SUPABASE_URL/rest/v1/agent_activity" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{\"type\": \"task_update\", \"summary\": \"$SUMMARY\", \"task_id\": \"$TASK_ID\"}"
