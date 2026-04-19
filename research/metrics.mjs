// research/metrics.mjs
//
// Extracts the "Metric" shell block from a goal spec and runs it in a target
// directory. Returns a single integer — the coordinator's success signal.
//
// Why a shell-block-in-markdown rather than a JSON config? Goal authors can
// read + edit the metric in the same file that describes the goal. One source
// of truth, no config drift.

import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const pExecFile = promisify(execFile);

/**
 * Read the first fenced ```bash block under a "## Metric" heading. The whole
 * block is executed as a single shell command; whatever the block prints on
 * stdout's last non-empty line is parsed as an integer.
 */
export async function loadMetric(goalPath) {
  const md = await readFile(goalPath, "utf-8");
  const match = md.match(/##\s*Metric[\s\S]*?```bash\n([\s\S]*?)\n```/i);
  if (!match) {
    throw new Error(`No ## Metric bash block found in ${goalPath}`);
  }
  return match[1].trim();
}

/**
 * Run the metric shell script in `cwd` and return its value as a Number.
 * Non-numeric output is treated as Infinity so the coordinator treats it as
 * "worse than any real measurement."
 */
export async function measure(cwd, metricScript) {
  const { stdout } = await pExecFile("bash", ["-lc", metricScript], {
    cwd,
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, CI: "1" },
  }).catch((err) => ({ stdout: String(err.stdout ?? "") }));

  const lastLine = stdout
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .pop();

  const n = Number(lastLine);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}
