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
 * The permission mode is "acceptEdits" so Claude can apply Edit/Write without
 * interactive approval — essential for autonomous loops. Bash is NOT
 * auto-approved; the agent can still ask to run commands but the loop will
 * interrupt. For now we're only editing files, so this is fine. If you need
 * the agent to run bash, flip to "bypassPermissions" and review the guardrails
 * in the goal spec very carefully.
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
        "acceptEdits",
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
