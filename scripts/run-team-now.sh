#!/bin/bash
# Run the full agent team immediately (manual trigger)
# Usage: bash scripts/run-team-now.sh
echo "🤖 Starting Circlo Agent Team..."
echo "   Dev (Lead) → Pixel (Design) → Shield (Security) → Pulse (QA)"
echo ""
echo "Logs will appear in: scripts/logs/"
echo "Follow live: tail -f scripts/logs/team-$(date +%Y%m%d)*.log"
echo ""
bash /Users/guyavnaim/Desktop/circlo/scripts/agent-team-runner.sh &
echo "Team running in background (PID: $!)"
