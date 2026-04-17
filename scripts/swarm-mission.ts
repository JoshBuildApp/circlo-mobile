/**
 * Swarm Mission Runner — Phase 1 MVP
 *
 * Wrapper around `claude -p` that:
 *   1. Creates a row in `dev_missions` (status=running)
 *   2. Pulls latest from main, creates fresh staging branch `agent-staging/YYYY-MM-DD-HHmm`
 *   3. Spawns the Queen Claude session with the mission prompt
 *   4. After Queen finishes: ensures build passes, summarizes diff, marks row 'awaiting_review'
 *   5. On failure: marks row 'failed' with error_message
 *
 * Usage:
 *   # Dry-run (no claude call, validates env + creates row + branch):
 *   npx tsx scripts/swarm-mission.ts --dry-run
 *
 *   # Real run (spawns the Queen):
 *   npx tsx scripts/swarm-mission.ts
 *
 *   # Override max turns or model:
 *   SWARM_MAX_TURNS=200 SWARM_MODEL=sonnet npx tsx scripts/swarm-mission.ts
 *
 * Environment (loaded from .env in repo root):
 *   SUPABASE_URL              (default from VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_KEY      REQUIRED — service_role key (dev_missions has strict RLS)
 *   SWARM_MAX_TURNS           (default 200)
 *   SWARM_MODEL               (default 'sonnet' — Claude CLI flag value)
 *   SWARM_REPO_DIR            (default: this repo's root)
 *   SWARM_PROMPT_FILE         (default: ./scripts/swarm-mission-prompt.md)
 *
 * NOTE: This is the manual-trigger entry point. The 6-hour scheduler in Phase 3
 * will invoke this same script on its cadence.
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

// ─── Config ────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..");

// Tiny .env loader — avoids a dotenv dependency.
// Reads KEY=value or KEY="value" lines and sets them on process.env if not already set.
function loadDotEnv(path: string) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
loadDotEnv(resolve(REPO_ROOT, ".env"));

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://rsevfeogormnorvcvxio.supabase.co";

// dev_missions RLS requires auth.uid() with developer/admin role to insert/update.
// The anon/publishable key has no auth.uid(), so writes fail.
// We REQUIRE the service_role key here. It bypasses RLS.
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!SUPABASE_SERVICE_KEY) {
  console.error(
    "[swarm FATAL] SUPABASE_SERVICE_KEY not set.\n" +
      "  Add it to .env — get the service_role key from:\n" +
      "  https://supabase.com/dashboard/project/rsevfeogormnorvcvxio/settings/api-keys"
  );
  process.exit(1);
}
const SUPABASE_KEY = SUPABASE_SERVICE_KEY;

const MAX_TURNS = parseInt(process.env.SWARM_MAX_TURNS || "200", 10);
const MODEL = process.env.SWARM_MODEL || "sonnet";
const PROMPT_FILE = process.env.SWARM_PROMPT_FILE || resolve(__dirname, "swarm-mission-prompt.md");
const TARGET_REPO = "circlo-mobile";

const DRY_RUN = process.argv.includes("--dry-run");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Logging helpers ───────────────────────────────────────────────────────

const log = (msg: string) => console.log(`[swarm ${new Date().toISOString()}] ${msg}`);
const die = (msg: string, err?: unknown): never => {
  console.error(`[swarm FATAL] ${msg}`);
  if (err) console.error(err);
  process.exit(1);
};

// ─── Shell helpers ─────────────────────────────────────────────────────────

interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

function run(cmd: string, args: string[], cwd = REPO_ROOT, captureOnly = false): RunResult {
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: captureOnly ? ["ignore", "pipe", "pipe"] : ["ignore", "pipe", "pipe"],
  });
  return {
    code: result.status ?? -1,
    stdout: (result.stdout || "").toString(),
    stderr: (result.stderr || "").toString(),
  };
}

function git(...args: string[]): RunResult {
  return run("git", args);
}

// ─── Branch naming ─────────────────────────────────────────────────────────

function buildBranchName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  // Include seconds to make collisions vanishingly unlikely on rapid re-runs.
  return `agent-staging/${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// ─── Resolve claude binary (lifted from council.mjs pattern) ──────────────

function resolveClaudeBinary(): string {
  if (process.env.SWARM_CLAUDE_BIN && existsSync(process.env.SWARM_CLAUDE_BIN)) {
    return process.env.SWARM_CLAUDE_BIN;
  }
  const which = spawnSync("which", ["claude"], { encoding: "utf8" });
  if (which.status === 0 && which.stdout.trim()) return which.stdout.trim();
  // Common install locations
  const candidates = [
    `${process.env.HOME}/.local/bin/claude`,
    "/usr/local/bin/claude",
    "/opt/homebrew/bin/claude",
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return die("Could not locate `claude` binary. Set SWARM_CLAUDE_BIN explicitly.") as never;
}

// ─── Mission row helpers ───────────────────────────────────────────────────

interface CreateMissionArgs {
  branch: string;
}

async function createMissionRow({ branch }: CreateMissionArgs) {
  const title = `Swarm run — ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;
  const { data, error } = await supabase
    .from("dev_missions")
    .insert({
      title,
      description: `Hive-mind run targeting ${TARGET_REPO}. Branch: ${branch}.`,
      status: "running",
      run_kind: "swarm_run",
      target_repo: TARGET_REPO,
      branch,
      started_at: new Date().toISOString(),
      category: "swarm",
      priority: "high",
    })
    .select()
    .single();
  if (error) die("Failed to create dev_missions row", error);
  return data!;
}

async function updateMission(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase
    .from("dev_missions")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("[swarm] failed to update dev_missions row", error);
}

// ─── Diff stats ────────────────────────────────────────────────────────────

function diffStats(baseBranch: string): { filesChanged: number; commits: number } {
  // Compare staging branch (HEAD) against the branch we forked from (e.g. makeover-merged).
  // Falls back to comparing against itself (no diff) if the base branch ref is missing.
  const files = git("diff", "--name-only", `${baseBranch}..HEAD`).stdout.trim();
  const commits = git("rev-list", "--count", `${baseBranch}..HEAD`).stdout.trim();
  return {
    filesChanged: files ? files.split("\n").length : 0,
    commits: commits ? parseInt(commits, 10) : 0,
  };
}

// ─── Spawn the Queen ───────────────────────────────────────────────────────

interface QueenResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function spawnQueen(prompt: string): Promise<QueenResult> {
  return new Promise((res) => {
    const claude = resolveClaudeBinary();
    log(`Spawning Queen via ${claude} (max-turns=${MAX_TURNS}, model=${MODEL})`);
    // --dangerously-skip-permissions: required for autonomous runs. The Queen needs
    // Bash (npm run build, git commit), Edit, and Task tools without approval prompts.
    // The mission prompt enforces hard rules (no git push, no branch switch, no
    // secrets-adjacent files) instead of relying on tool-level permissions. This
    // matches the pattern council.mjs uses for multi-agent debate.
    const child = spawn(
      claude,
      [
        "-p",
        prompt,
        "--max-turns",
        String(MAX_TURNS),
        "--dangerously-skip-permissions",
        "--model",
        MODEL,
      ],
      { cwd: REPO_ROOT, stdio: ["ignore", "pipe", "pipe"] }
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      const s = d.toString();
      stdout += s;
      process.stdout.write(s);
    });
    child.stderr.on("data", (d) => {
      const s = d.toString();
      stderr += s;
      process.stderr.write(s);
    });
    child.on("close", (code) => res({ exitCode: code ?? -1, stdout, stderr }));
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  log(`Swarm mission starting (DRY_RUN=${DRY_RUN}, target=${TARGET_REPO})`);
  log(`Repo root: ${REPO_ROOT}`);

  // Capture the original branch so we can always switch back on failure.
  const originalBranch = git("branch", "--show-current").stdout.trim() || "main";
  log(`Original branch: ${originalBranch}`);

  // 1. Verify clean working tree. Ignore:
  //    - .env (tracked legacy, now gitignored-in-spirit)
  //    - Capacitor sync artifacts that get churned by `npm run cap:sync` and
  //      aren't semantically "the user's work"
  const IGNORE_DIRTY = new Set([
    ".env",
    ".env.local",
    ".env.save",
    "android/app/capacitor.build.gradle",
    "android/app/src/main/AndroidManifest.xml",
    "android/capacitor.settings.gradle",
    "ios/App/App.xcodeproj/project.pbxproj",
    "ios/App/App/Info.plist",
  ]);
  const status = git("status", "--porcelain");
  const dirtyLines = status.stdout
    .split("\n")
    .filter((l) => l.length > 0)
    .filter((l) => {
      // Porcelain format is exactly: 2 status chars + 1 space + path. Trim leading 3.
      const path = l.slice(3).trim();
      return !IGNORE_DIRTY.has(path);
    });
  if (dirtyLines.length > 0) {
    die(
      `Working tree is not clean. Commit or stash changes before running.\n${dirtyLines.join("\n")}`
    );
  }

  // 2. Fetch (don't merge — current branch may be a feature branch the user is working on).
  //    The staging branch is based on current HEAD, whatever that is.
  log("git fetch origin…");
  const fetched = git("fetch", "origin", "--quiet");
  if (fetched.code !== 0) {
    log(`git fetch failed (exit ${fetched.code}). Continuing with local refs.`);
    log(fetched.stderr);
  }

  // 3. Create staging branch
  const branch = buildBranchName();
  log(`Creating branch ${branch}`);
  const checkout = git("checkout", "-b", branch);
  if (checkout.code !== 0) die(`Failed to create branch ${branch}: ${checkout.stderr}`);

  // From here on, any failure must restore the original branch + delete the staging branch.
  // Wrap the rest in try/catch so we always run cleanup.
  try {
    await runMissionBody(branch, originalBranch);
  } catch (err) {
    log(`Mission body threw: ${err instanceof Error ? err.message : String(err)}`);
    log(`Cleanup: returning to ${originalBranch} and deleting ${branch}`);
    git("checkout", originalBranch);
    git("branch", "-D", branch);
    throw err;
  }
}

async function runMissionBody(branch: string, originalBranch: string) {
  // 4. Create dev_missions row
  const mission = await createMissionRow({ branch });
  log(`Created dev_missions row id=${mission.id}`);

  // 5. Build prompt by templating
  if (!existsSync(PROMPT_FILE)) die(`Prompt file not found: ${PROMPT_FILE}`);
  const promptTemplate = readFileSync(PROMPT_FILE, "utf8");
  const prompt = promptTemplate
    .replaceAll("{{MISSION_ID}}", mission.id)
    .replaceAll("{{BRANCH_NAME}}", branch);

  if (DRY_RUN) {
    log(`DRY_RUN — skipping Queen spawn. Returning to ${originalBranch}.`);
    git("checkout", originalBranch);
    git("branch", "-D", branch);
    await updateMission(mission.id, {
      status: "rejected",
      finished_at: new Date().toISOString(),
      error_message: "Dry-run — no work performed.",
    });
    log("Dry-run complete. dev_missions row marked rejected.");
    return;
  }

  // 6. Spawn the Queen
  const startedAt = Date.now();
  const queen = await spawnQueen(prompt);
  const durationMs = Date.now() - startedAt;
  log(`Queen exited code=${queen.exitCode} duration=${(durationMs / 1000).toFixed(1)}s`);

  // 7. Final build gate (Queen should already have done this, but verify)
  log("Running final npm run build…");
  const build = run("npm", ["run", "build"]);
  const buildPassed = build.code === 0;
  log(`Build ${buildPassed ? "PASSED" : "FAILED"} (exit ${build.code})`);

  // 8. Compute diff stats vs the branch we forked from
  const stats = diffStats(originalBranch);
  log(`Diff vs ${originalBranch}: ${stats.commits} commits, ${stats.filesChanged} files changed`);

  // 9. Update mission row
  const finalStatus = !buildPassed
    ? "failed"
    : queen.exitCode !== 0
    ? "failed"
    : stats.commits === 0
    ? "rejected"
    : "awaiting_review";

  await updateMission(mission.id, {
    status: finalStatus,
    finished_at: new Date().toISOString(),
    build_passed: buildPassed,
    build_log: build.stdout.slice(-4000) + "\n---STDERR---\n" + build.stderr.slice(-2000),
    files_changed_count: stats.filesChanged,
    commits_count: stats.commits,
    error_message:
      finalStatus === "failed"
        ? `Build passed=${buildPassed}, queen exit=${queen.exitCode}`
        : finalStatus === "rejected"
        ? "Queen made no commits — nothing to review."
        : null,
    progress: 100,
  });

  log(`Mission ${mission.id} → status=${finalStatus}`);

  // 10. Always return to the original branch so the user's working state isn't disturbed.
  //     The staging branch sticks around — review it via `git diff main..agent-staging/...`
  //     or via the dashboard.
  if (finalStatus === "awaiting_review") {
    log(`✅ Branch ${branch} is ready for review.`);
    log(`   Preview: git diff main..${branch}`);
    log(`   Approve via dashboard, or manually: git checkout main && git merge ${branch} && git push`);
  } else {
    log(`Mission did not produce reviewable changes (${finalStatus}).`);
  }
  log(`Returning to ${originalBranch}.`);
  git("checkout", originalBranch);
  if (finalStatus === "rejected" || finalStatus === "failed") {
    git("branch", "-D", branch);
  }
}

main().catch((err) => die("Unhandled error in main()", err));
