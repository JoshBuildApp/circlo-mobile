#!/usr/bin/env node
// research/coordinator.mjs
//
// Drive a single-number code-quality metric toward zero by looping an agent
// in an isolated git worktree. Never touches the branch you invoked from.
//
// Usage:
//   node research/coordinator.mjs <goal-id>
//   node research/coordinator.mjs 01-tsc-cleanup --live --max-iter 10
//
// See research/README.md for the full design + guardrails.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadMetric, measure } from "./metrics.mjs";
import { runAgent } from "./agent-step.mjs";

const pExecFile = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* ------------------------------------------------------------------------ */
/*  CLI                                                                      */
/* ------------------------------------------------------------------------ */

const args = process.argv.slice(2);
const goalId = args[0];
if (!goalId) {
  console.error("Usage: node research/coordinator.mjs <goal-id> [--live] [--max-iter N] [--branch NAME]");
  process.exit(2);
}
const opts = parseOpts(args.slice(1));

/* ------------------------------------------------------------------------ */
/*  Main                                                                     */
/* ------------------------------------------------------------------------ */

await main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});

async function main() {
  const goalPath = join(ROOT, "research", "goals", `${goalId}.md`);
  await assertExists(goalPath, `goal spec not found: ${goalPath}`);

  const metricScript = await loadMetric(goalPath);
  const goalMd = await readFile(goalPath, "utf-8");

  const runTs = new Date().toISOString().replace(/[:.]/g, "-");
  // Full timestamp in the branch name so multiple runs/day don't collide.
  // runTs is already unique per run.
  const branch = opts.branch ?? `research/${goalId}-${runTs}`;
  const worktreePath = join(ROOT, "research", "worktrees", `${goalId}-${runTs}`);
  const logDir = join(ROOT, "research", "logs", goalId, runTs);

  await mkdir(logDir, { recursive: true });
  await mkdir(dirname(worktreePath), { recursive: true });

  const baseBranch = await currentBranch(ROOT);

  banner([
    `goal:       ${goalId}`,
    `base:       ${baseBranch}`,
    `branch:     ${branch}`,
    `worktree:   ${rel(worktreePath)}`,
    `log dir:    ${rel(logDir)}`,
    `mode:       ${opts.live ? "LIVE (will invoke claude)" : "DRY-RUN (prints prompts)"}`,
    `max iters:  ${opts.maxIter}`,
  ]);

  console.log(`\n[setup] creating worktree...`);
  await sh(ROOT, ["git", "worktree", "add", "-b", branch, worktreePath, baseBranch]);

  const baseline = await measure(worktreePath, metricScript);
  console.log(`[baseline] ${baseline} (metric should decrease)\n`);

  let current = baseline;
  let stagnantRuns = 0;
  const history = [{ iter: 0, metric: baseline, verdict: "baseline" }];

  for (let i = 1; i <= opts.maxIter; i++) {
    console.log(`\n─── iteration ${i}/${opts.maxIter} ────────────────`);
    console.log(`[metric] before: ${current}`);

    if (current === 0) {
      console.log("[done] metric reached 0 before iteration started");
      break;
    }

    const prompt = await buildPrompt({
      goalMd,
      worktreePath,
      currentMetric: current,
      baseline,
      iterIdx: i,
      maxIter: opts.maxIter,
    });

    const agentRes = await runAgent({
      prompt,
      cwd: worktreePath,
      dryRun: !opts.live,
      iterIdx: i,
      logDir,
    });

    const after = await measure(worktreePath, metricScript);
    const delta = after - current;
    const improved = after < current;
    console.log(`[metric] after:  ${after}  (${delta >= 0 ? "+" : ""}${delta})`);

    let verdict = "unchanged";
    if (improved) {
      verdict = "committed";
      const msg = `research(${goalId}): iter ${i} — metric ${current} → ${after}`;
      await sh(worktreePath, ["git", "add", "-A"]);
      const hasChanges = (await sh(worktreePath, ["git", "diff", "--cached", "--quiet"], { allowFail: true })).exitCode !== 0;
      if (hasChanges) {
        await sh(worktreePath, ["git", "commit", "-m", msg]);
      } else {
        verdict = "no-diff";
      }
      current = after;
      stagnantRuns = 0;
    } else if (after > current) {
      verdict = "reverted (regression)";
      await sh(worktreePath, ["git", "reset", "--hard", "HEAD"]);
      await sh(worktreePath, ["git", "clean", "-fd"]);
      stagnantRuns++;
    } else {
      verdict = "reverted (no-op)";
      await sh(worktreePath, ["git", "reset", "--hard", "HEAD"]);
      await sh(worktreePath, ["git", "clean", "-fd"]);
      stagnantRuns++;
    }

    history.push({ iter: i, metric: after, verdict });

    await writeFile(
      join(logDir, `iter-${pad(i)}.md`),
      renderIterLog({ i, current, after, delta, verdict, agentRes, prompt }),
      "utf-8",
    );

    console.log(`[verdict] ${verdict}`);

    if (stagnantRuns >= 3) {
      console.log("\n[done] three consecutive no-progress iterations — stopping");
      break;
    }
    if (agentRes.stdout.includes("STUCK")) {
      console.log("\n[done] agent emitted STUCK — stopping");
      break;
    }
    if (current === 0) {
      console.log("\n[done] metric reached 0");
      break;
    }
  }

  await writeFile(join(logDir, "summary.md"), renderSummary({ goalId, baseline, history }), "utf-8");

  banner([
    `SUMMARY`,
    `baseline:  ${baseline}`,
    `final:     ${current}`,
    `committed: ${history.filter((h) => h.verdict === "committed").length}`,
    `reverted:  ${history.filter((h) => String(h.verdict).startsWith("reverted")).length}`,
    `log:       ${rel(logDir)}/summary.md`,
    `worktree:  ${rel(worktreePath)}  (branch: ${branch})`,
  ]);

  console.log(`\nReview the diff with: git -C ${rel(worktreePath)} log --oneline ${baseBranch}..HEAD`);
  console.log(`When ready, open a PR from branch: ${branch}`);
  console.log(`To drop the worktree: git worktree remove ${rel(worktreePath)} && git branch -D ${branch}`);
}

/* ------------------------------------------------------------------------ */
/*  Prompt composition                                                       */
/* ------------------------------------------------------------------------ */

async function buildPrompt({ goalMd, worktreePath, currentMetric, baseline, iterIdx, maxIter }) {
  return [
    `You are iteration ${iterIdx} of ${maxIter} in an autonomous research loop.`,
    ``,
    `Working directory: ${worktreePath}`,
    ``,
    `Current metric value: ${currentMetric}`,
    `Baseline at loop start: ${baseline}`,
    `Target: 0 (lower is better)`,
    ``,
    `---`,
    ``,
    `GOAL SPEC (read fully, then act):`,
    ``,
    goalMd,
    ``,
    `---`,
    ``,
    `Your task this iteration:`,
    `- Make exactly one focused edit that STRICTLY DECREASES the metric.`,
    `- Do not touch out-of-scope files listed in the spec.`,
    `- Do not use any anti-cheating pattern listed in the spec.`,
    `- If after investigation you believe the metric cannot be improved further without human input, reply with a single line containing the literal token STUCK and stop.`,
    `- The coordinator will measure the metric after you finish. If your edit regressed or did nothing, the coordinator will revert it automatically — do not waste effort on self-validation beyond what you need to form your edit.`,
    ``,
    `Begin.`,
  ].join("\n");
}

/* ------------------------------------------------------------------------ */
/*  Rendering helpers                                                        */
/* ------------------------------------------------------------------------ */

function renderIterLog({ i, current, after, delta, verdict, agentRes, prompt }) {
  return [
    `# Iteration ${i}`,
    ``,
    `- before: **${current}**`,
    `- after:  **${after}**`,
    `- delta:  ${delta >= 0 ? "+" : ""}${delta}`,
    `- verdict: **${verdict}**`,
    `- exit code: ${agentRes.exitCode}`,
    ``,
    `## Prompt`,
    `\n\`\`\`\n${prompt}\n\`\`\`\n`,
    `## Agent stdout`,
    `\n\`\`\`\n${truncate(agentRes.stdout, 8_000)}\n\`\`\`\n`,
    agentRes.stderr ? `## Agent stderr\n\n\`\`\`\n${truncate(agentRes.stderr, 4_000)}\n\`\`\`\n` : "",
  ].join("\n");
}

function renderSummary({ goalId, baseline, history }) {
  const header = [
    `# Run summary — ${goalId}`,
    ``,
    `- baseline: ${baseline}`,
    `- final:    ${history.at(-1)?.metric}`,
    `- iterations: ${history.length - 1}`,
    `- committed: ${history.filter((h) => h.verdict === "committed").length}`,
    ``,
    `| iter | metric | verdict |`,
    `|-----:|-------:|:--------|`,
  ];
  const rows = history.map((h) => `| ${h.iter} | ${h.metric} | ${h.verdict} |`);
  return header.concat(rows).join("\n");
}

/* ------------------------------------------------------------------------ */
/*  Helpers                                                                  */
/* ------------------------------------------------------------------------ */

async function assertExists(p, msg) {
  try {
    await stat(p);
  } catch {
    throw new Error(msg);
  }
}

async function currentBranch(cwd) {
  const { stdout } = await pExecFile("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd });
  return stdout.trim();
}

async function sh(cwd, argv, { allowFail = false } = {}) {
  const child = await pExecFile(argv[0], argv.slice(1), { cwd }).catch((err) => err);
  if (child.code && !allowFail) {
    throw new Error(`[shell] ${argv.join(" ")} failed: ${child.stderr || child.message}`);
  }
  return { stdout: child.stdout || "", stderr: child.stderr || "", exitCode: child.code ?? 0 };
}

function parseOpts(rest) {
  const o = { live: false, maxIter: 20, branch: undefined };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--live") o.live = true;
    else if (a === "--max-iter") o.maxIter = Number(rest[++i]);
    else if (a === "--branch") o.branch = rest[++i];
    else {
      console.error(`unknown option: ${a}`);
      process.exit(2);
    }
  }
  return o;
}

function rel(p) {
  return p.replace(ROOT + "/", "");
}

function pad(n) {
  return String(n).padStart(3, "0");
}

function truncate(s, max) {
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n…[truncated ${s.length - max} chars]`;
}

function banner(lines) {
  const w = Math.max(...lines.map((l) => l.length)) + 4;
  const bar = "─".repeat(w);
  console.log(`\n${bar}\n${lines.map((l) => `  ${l}`).join("\n")}\n${bar}`);
}
