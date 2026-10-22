/**
 * Publishes `screenshots/*.png` for the current branch and prints the PR
 * markdown that shows them.
 *
 *   pnpm screenshots:publish
 *
 * Images go to `<branch>/` on the orphan `pr-screenshots` branch, so `main`
 * never carries them. The repo is public: only screenshots of the e2e seed
 * data belong there.
 */

import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ASSET_BRANCH = "pr-screenshots";
const SOURCE_DIR = "screenshots";
const SIZES = ["phone", "desktop"] as const;
const WIDTHS = { desktop: 640, phone: 280 } as const;
const SHOT_FILE = /^(?<name>.+)-(?<size>phone|desktop)\.png$/;
const GITHUB_REMOTE = /github\.com[/:](?<repo>[^/]+\/[^/]+?)(?:\.git)?$/;

const git = (args: string[], cwd?: string) =>
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const branch = git(["branch", "--show-current"]);
if (!branch || branch === "main") {
  fail("Run this on the PR's branch, not main.");
}
const repo =
  GITHUB_REMOTE.exec(git(["remote", "get-url", "origin"]))?.groups?.repo ??
  fail("origin is not a GitHub remote.");

const files = readdirSync(SOURCE_DIR, { withFileTypes: true })
  .filter((entry) => entry.isFile() && SHOT_FILE.test(entry.name))
  .map((entry) => entry.name)
  .sort();
if (files.length === 0) {
  fail(`No <name>-<phone|desktop>.png files in ${SOURCE_DIR}/.`);
}

const folder = branch.replaceAll("/", "-");
const worktree = mkdtempSync(join(tmpdir(), "pr-screenshots-"));
let sha = "";
try {
  const hasRemote = git(["ls-remote", "--heads", "origin", ASSET_BRANCH]);
  if (hasRemote) {
    git(["fetch", "origin", ASSET_BRANCH]);
    git(["worktree", "add", "--detach", worktree, "FETCH_HEAD"]);
  } else {
    git(["worktree", "add", "--detach", worktree]);
    git(["switch", "--orphan", ASSET_BRANCH], worktree);
  }
  // A re-run replaces the branch's earlier screenshots.
  rmSync(join(worktree, folder), { force: true, recursive: true });
  mkdirSync(join(worktree, folder));
  for (const file of files) {
    cpSync(join(SOURCE_DIR, file), join(worktree, folder, file));
  }
  git(["add", "--all", folder], worktree);
  git(["commit", "--quiet", "-m", `screenshots: ${branch}`], worktree);
  git(
    ["push", "--quiet", "origin", `HEAD:refs/heads/${ASSET_BRANCH}`],
    worktree
  );
  // Link the commit, not the branch, so later runs never change an old PR.
  sha = git(["rev-parse", "HEAD"], worktree);
} finally {
  git(["worktree", "remove", "--force", worktree]);
  // The first run creates the orphan branch locally; only the remote matters.
  if (git(["branch", "--list", ASSET_BRANCH])) {
    git(["branch", "-D", ASSET_BRANCH]);
  }
}

const names = [
  ...new Set(files.map((file) => SHOT_FILE.exec(file)?.groups?.name ?? "")),
];
const cell = (name: string, size: (typeof SIZES)[number]) =>
  files.includes(`${name}-${size}.png`)
    ? `<img src="https://raw.githubusercontent.com/${repo}/${sha}/${folder}/${name}-${size}.png" width="${WIDTHS[size]}" alt="${name}, ${size}">`
    : "";

console.log(
  [
    "## Screenshots",
    "",
    "| | Phone | Desktop |",
    "| --- | --- | --- |",
    ...names.map(
      (name) =>
        `| ${name} | ${cell(name, "phone")} | ${cell(name, "desktop")} |`
    ),
  ].join("\n")
);
