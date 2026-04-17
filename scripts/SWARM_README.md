# Circlo Swarm Runner — Setup & Runbook

> A hive-mind swarm that pulls tasks from Supabase, delegates to named agents (Pixel, Forge, Atlas…), works in an isolated staging branch, runs `npm run build` as a hard gate, and produces a reviewable diff every 6 hours.

---

## The 30-second version

1. Cron fires `scripts/swarm-cron.sh` → which calls `npx tsx scripts/swarm-mission.ts`.
2. Wrapper creates `agent-staging/YYYY-MM-DD-HHMMSS` branch + a `dev_missions` row (status=`running`).
3. Spawns a Queen Claude session with `scripts/swarm-mission-prompt.md`.
4. Queen reads your 14 agents from the `agents` table, pulls pending `agent_tasks` for `circlo-hub`, delegates each task to the best-fit agent via the `Task` tool, runs `npm run build` per task as a gate.
5. Discover phase: Queen audits the codebase + writes 3-5 new tasks back into `agent_tasks` (capped at 50 pending, prefixed `[auto]`).
6. Wrapper updates `dev_missions` row → `awaiting_review` (if commits exist + build passes), `rejected` (no commits), or `failed` (build broken / queen crashed).
7. You review in the morning via SQL, CLI, or dashboard and run the merge manually.

---

## Files

| Path | Role |
|---|---|
| `scripts/swarm-mission.ts` | TS wrapper — handles git, build gate, dev_missions writes |
| `scripts/swarm-mission-prompt.md` | Queen's full mission prompt (hard rules, 5 phases) |
| `scripts/swarm-cron.sh` | Bash entry point for launchd (resolves PATH, logs to `scripts/logs/`) |
| `~/Library/LaunchAgents/com.circlo.swarm-mission.plist` | macOS schedule: every 6h at :13 past |
| `scripts/logs/swarm-run-*.log` | Per-run log files from launchd |
| `scripts/logs/launchd-{stdout,stderr}.log` | launchd's own output capture |

---

## Schedule

| Time (local) | Fires |
|---|---|
| 02:13 | Night shift |
| 08:13 | Morning check |
| 14:13 | Afternoon |
| 20:13 | Evening |

Change by editing `~/Library/LaunchAgents/com.circlo.swarm-mission.plist` then:
```
launchctl unload ~/Library/LaunchAgents/com.circlo.swarm-mission.plist
launchctl load ~/Library/LaunchAgents/com.circlo.swarm-mission.plist
```

---

## ⚠️ macOS Full Disk Access (FDA) is REQUIRED

launchd-spawned processes can't touch `~/Desktop` without FDA. If you see `Operation not permitted` in `scripts/logs/launchd-stderr.log`, grant FDA:

1. Open **System Settings → Privacy & Security → Full Disk Access**
2. Click `+`, press `Cmd+Shift+G`, type `/bin/bash`, press Enter, add it
3. Enable the toggle
4. Same for `/Users/guyavnaim/.local/bin/npx` if that also fails
5. Restart launchd job:
   ```
   launchctl kickstart -k gui/$(id -u)/com.circlo.swarm-mission
   ```

Until FDA is granted, the schedule won't fire. **Workaround:** trigger manually from Terminal (Terminal already has FDA):
```
cd "/Users/guyavnaim/Desktop/circlo/ADMIN-DASHBOARD (circlo-hub)"
npx tsx scripts/swarm-mission.ts
```

---

## Environment

`.env` in circlo-hub root must contain:
```
VITE_SUPABASE_URL="https://rsevfeogormnorvcvxio.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="..."           # anon/publishable key (public)
SUPABASE_SERVICE_KEY="sb_secret_..."          # REQUIRED — service_role key, bypasses RLS
```

Get `SUPABASE_SERVICE_KEY` from: https://supabase.com/dashboard/project/rsevfeogormnorvcvxio/settings/api-keys

**`.env` is marked `--skip-worktree`** — git ignores changes to it even though the file is still tracked. If you ever need to update it in git, run `git update-index --no-skip-worktree .env` first.

---

## Database

### `dev_missions` — the run log
The existing `dev_missions` table has been extended with swarm-run columns. Status values added:
- `running` — swarm is actively working
- `awaiting_review` — done, commits exist, build passed, waiting for you
- `approved` — you clicked Approve (dashboard writes this)
- `pushed` — branch merged into main and pushed
- `rejected` — you rejected OR Queen made no commits
- `failed` — build broke or Queen errored

Key columns for review:
| Column | Purpose |
|---|---|
| `branch` | The `agent-staging/...` branch to diff |
| `build_passed` | bool — did `npm run build` succeed |
| `tasks_completed_count` | tasks pulled from queue and finished |
| `tasks_generated_count` | new tasks the discover phase wrote |
| `files_changed_count` | git diff --name-only count |
| `commits_count` | git rev-list count vs original branch |
| `agents_used` | jsonb `[{agent_id, name, tasks_done}]` |
| `notes` | Queen's markdown report |
| `build_log` | last 4KB of `npm run build` output |
| `error_message` | if failed, why |

### `agent_tasks` — the queue
Tasks where `project IN ('circlo-hub','circlo')` get picked up. Self-generated tasks have `[auto]` prefix in title.

---

## Reviewing a run

```sql
-- Most recent swarm runs
SELECT id, title, status, branch, tasks_completed_count, commits_count, build_passed,
       finished_at - started_at AS duration
FROM dev_missions
WHERE run_kind = 'swarm_run'
ORDER BY started_at DESC NULLS LAST
LIMIT 10;

-- Runs awaiting your review
SELECT id, branch, commits_count, files_changed_count, notes
FROM dev_missions
WHERE run_kind = 'swarm_run' AND status = 'awaiting_review'
ORDER BY finished_at DESC;
```

From circlo-hub directory:
```
git fetch
git log --oneline makeover-merged..agent-staging/2026-04-17-HHMMSS
git diff makeover-merged..agent-staging/2026-04-17-HHMMSS
```

---

## Approving a run (manual, until dashboard exists)

```bash
cd "/Users/guyavnaim/Desktop/circlo/ADMIN-DASHBOARD (circlo-hub)"
BRANCH="agent-staging/2026-04-17-HHMMSS"

# Review the diff
git diff main..$BRANCH

# Approve: merge to main and push
git checkout main
git merge --no-ff $BRANCH -m "[swarm] merge approved run $BRANCH"
git push origin main
git branch -d $BRANCH

# Mark the dev_missions row pushed
# (run in Supabase SQL editor)
UPDATE dev_missions
SET status='pushed', pushed=true, pushed_at=now(), approved=true, approved_at=now()
WHERE branch='agent-staging/2026-04-17-HHMMSS';
```

---

## Rejecting a run

```bash
BRANCH="agent-staging/2026-04-17-HHMMSS"
git branch -D $BRANCH
```
```sql
UPDATE dev_missions SET status='rejected', approved=false, approved_at=now()
WHERE branch='agent-staging/2026-04-17-HHMMSS';
```

---

## Disabling the schedule

```bash
launchctl unload ~/Library/LaunchAgents/com.circlo.swarm-mission.plist
# or remove the plist entirely
rm ~/Library/LaunchAgents/com.circlo.swarm-mission.plist
```

---

## Troubleshooting

**Logs are the first place to look:**
```
ls -lt "/Users/guyavnaim/Desktop/circlo/ADMIN-DASHBOARD (circlo-hub)/scripts/logs/"
tail -100 "/Users/guyavnaim/Desktop/circlo/ADMIN-DASHBOARD (circlo-hub)/scripts/logs/swarm-run-*.log"
tail -50 "/Users/guyavnaim/Desktop/circlo/ADMIN-DASHBOARD (circlo-hub)/scripts/logs/launchd-stderr.log"
```

| Symptom | Cause | Fix |
|---|---|---|
| `Operation not permitted` in stderr | macOS FDA | Grant FDA to `/bin/bash` (see above) |
| `SUPABASE_SERVICE_KEY not set` | Missing in .env | Add service_role key to `.env` |
| `Working tree is not clean` | Uncommitted files not in whitelist | Commit or stash them first |
| dev_missions row stuck `running` | Queen crashed mid-run | Check the staging branch; wrapper's try/catch should have run but a hard crash leaves it stuck |
| `new row violates check constraint` | Status/category not allowed | Run migration `dev_missions_extend_status_values` |
| Build fails every run | Genuine regression | Check the build_log column of the failed dev_missions row |

---

## Security note

The `SUPABASE_SERVICE_KEY` in `.env` bypasses all RLS. Treat it like a root password:

- Never commit (already skip-worktree'd)
- Never paste into chat / logs / PR descriptions
- Rotate immediately if exposed via: Supabase dashboard → Settings → API Keys → "Reset service_role"

---

## Owner

Built by Guy Avnaim with Claude Code, 2026-04-17.
