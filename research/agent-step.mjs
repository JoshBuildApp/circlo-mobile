// research/agent-step.mjs
//
// One iteration = one call to `claude -p` with a composed prompt. The agent
// edits files in the worktree; we measure before/after and the coordinator
// decides whether to commit or reset.
//
// Dry-run mode prints the prompt that WOULD be sent and returns immediately.
// Use it to validate prompt wording before burning tokens.

import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Invoke `claude -p` in the worktree. Returns { stdout, stderr, exitCode }.
 *
 * Permission mode is "bypassPermissions" so the agent can run bash itself —
 * critical for goals like tsc-cleanup where the agent must re-run the
 * compiler between edits to self-validate. This expands the blast radius to
 * the entire worktree (not just file edits), so:
 *
 *   - The worktree is the ONLY thing the agent can touch; `main` is isolated.
 *   - The coordinator's regression guard auto-reverts iterations that make
 *     the metric worse, so agent mistakes get wiped automatically.
 *   - Goal specs MUST enumerate forbidden bash patterns (see e.g.
 *     goals/01-tsc-cleanup.md's "Forbidden bash" section) — these ride with
 *     the prompt so the agent reads them before acting.
 *
 * Reviewed by a human. If you're adding a new goal, copy the forbidden-bash
 * list from an existing goal spec as your starting point.
 */
export async function runAgent({ prompt, cwd, dryRun, iterIdx, logDir }) {
  const promptPath = join(logDir, `iter-${pad(iterIdx)}-prompt.md`);
  await writeFile(promptPath, prompt, "utf-8");

  if (dryRun) {
    return {
      stdout: `[dry-run] prompt written to ${promptPath}\n[dry-run] no agent invocation\n`,
      stderr: "",
      exitCode: 0,
      promptPath,
    };
  }

  return new Promise((resolve) => {
    const child = spawn(
      "claude",
      [
        "-p",
        prompt,
        "--permission-mode",
        "bypassPermissions",
        "--output-format",
        "text",
      ],
      {
        cwd,
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      resolve({ stdout, stderr, exitCode: code ?? -1, promptPath });
    });
    child.on("error", (err) => {
      resolve({
        stdout,
        stderr: stderr + "\n" + String(err),
        exitCode: -1,
        promptPath,
      });
    });
  });
}

function pad(n) {
  return String(n).padStart(3, "0");
}
