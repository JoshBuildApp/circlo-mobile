#!/bin/bash
# Run the agent immediately (manual trigger)
# Usage: bash scripts/run-agent-now.sh
echo "🤖 Starting agent manually..."
bash /Users/guyavnaim/Desktop/circlo/scripts/agent-runner.sh &
AGENT_PID=$!
echo "Agent running in background (PID: $AGENT_PID)"
echo "Logs: scripts/logs/"
echo "To follow: tail -f scripts/logs/agent-run-$(date +%Y%m%d)*.log"
