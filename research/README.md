# research — autonomous iteration loop

Inspired by [karpathy/autoresearch](https://github.com/karpathy/autoresearch),
adapted from "train a tiny model overnight" to "drive a single-number code-
quality metric to zero."

## How it works

```
  ┌─────────────────────────────┐
  │ goals/<id>.md               │   one measurable goal per file
  └───────────────┬─────────────┘
                  │
  ┌───────────────▼─────────────┐
  │ coordinator.mjs             │   creates a git worktree,
  └───────────────┬─────────────┘   measures baseline,
                  │                 loops until metric hits 0
  ┌───────────────▼─────────────┐
  │ per iteration:              │
  │   1. metrics.mjs → N        │
  │   2. agent-step.mjs         │   spawns `claude -p` in the
  │   3. metrics.mjs → N'       │   worktree OR dry-runs
  │   4. N' < N? commit : reset │
  │   5. log to logs/<id>/…     │
  └─────────────────────────────┘
```

No agent output is merged to `main`. Every iteration lives in an isolated
git worktree; when metric reaches zero the coordinator opens a PR for human
review. That's the guardrail — humans merge, not the agent.

## Quick start

```bash
# from repo root

# 1. Dry-run — no agent invocation, shows what the loop would do
node research/coordinator.mjs 01-tsc-cleanup

# 2. Live run — actually spawns `claude -p` per iteration
node research/coordinator.mjs 01-tsc-cleanup --live

# 3. Cap iterations (default 20)
node research/coordinator.mjs 01-tsc-cleanup --live --max-iter 5

# 4. Specify a starting worktree branch name
node research/coordinator.mjs 01-tsc-cleanup --live --branch research/tsc-cleanup-2026-04-20
```

## Goals

| id | goal | metric | status |
|---|---|---|---|
| `01-tsc-cleanup` | Zero `tsc --noEmit` errors | `tsc 2>&1 \| grep -c "error TS"` → 0 | ready |

Each goal lives in [`goals/`](goals/) as a markdown file with a `## Metric`
section the coordinator reads and evaluates.

## Guardrails

1. **Worktree isolation** — every run lives in `research/worktrees/<goal>-<ts>/`.
   `main` is never touched.
2. **Iteration budget** — default 20 iterations, hard cap. Agent is told the
   budget in its prompt.
3. **Regression guard** — if the agent makes the metric *worse*, the
   coordinator `git reset --hard`s that iteration. Lost work, not lost repo.
4. **No bypass tokens** — agent spec forbids `@ts-ignore`, `@ts-expect-error`,
   `as any`, `!` non-null assertion, or disabling rules. Anti-cheating list
   is in the goal spec.
5. **Human merge gate** — coordinator opens a PR on success. Nothing merges
   without review.
6. **Dry-run first** — omit `--live` to print prompts without invoking the
   agent. Use before every new goal.

## What this DOESN'T do

- Find "bugs" that aren't expressed as failing tests or scanner findings.
- Guarantee code "perfection" — closes scanner-findable issues only.
- Replace code review. Opens PRs, doesn't merge.
- Handle subjective goals (UX, design, readability).

See the conversation that scoped this if you forgot why — we explicitly
decided NOT to chase an open-ended "fix every bug" loop because the signal
is noise and the agent halts at the first plausible-looking stopping point.

## Logs

`logs/<goal>/<run-ts>/iter-NNN.md` — one file per iteration:

- Before metric / after metric / delta
- Diff the agent applied
- Whether committed or reverted
- Agent stdout/stderr (trimmed)

`logs/<goal>/<run-ts>/summary.md` — final tally written when the loop exits.
