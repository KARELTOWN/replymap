import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Runs the unit tests of every folder of BugReveal.
//
// The four folders are four repositories: nothing above them can run their
// tests, so this walks them as siblings on disk. It is what the pre-push hook
// calls, and what one runs by hand before opening a merge request:
//
//     node scripts/test-all.js
//
// A folder without tests is reported, never counted as a failure: `record` and
// `sso` have none yet, and that must not stop a push from `back`.

const FOLDERS = ["back", "front", "record", "sso"];

// What `npm init` leaves behind. It exits 1, which would look like a failing
// suite forever.
const PLACEHOLDER = /no test specified/i;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const readScript = (folder) => {
  const manifest = path.join(root, folder, "package.json");
  if (!existsSync(manifest)) return null;
  try {
    return JSON.parse(readFileSync(manifest, "utf8")).scripts?.test ?? null;
  } catch {
    return null;
  }
};

const run = (folder) => {
  const cwd = path.join(root, folder);
  const script = readScript(folder);

  if (!existsSync(cwd)) return { folder, state: "absent" };
  if (!script || PLACEHOLDER.test(script)) return { folder, state: "aucun test" };
  if (!existsSync(path.join(cwd, "node_modules"))) return { folder, state: "dépendances absentes" };

  console.log(`\n──────── ${folder} ────────`);
  // `shell` so the npm wrapper is found on Windows as well.
  const result = spawnSync("npm", ["test", "--silent"], { cwd, stdio: "inherit", shell: true });
  return { folder, state: result.status === 0 ? "ok" : "échec" };
};

const results = FOLDERS.map(run);

console.log("\n──────── Résultat ────────");
for (const { folder, state } of results) {
  const mark = { ok: "✓", échec: "✖" }[state] ?? "·";
  console.log(`${mark} ${folder.padEnd(8)} ${state}`);
}

const failed = results.filter((result) => result.state === "échec");
if (failed.length > 0) {
  console.log(`\n${failed.length} dossier(s) en échec.`);
  process.exit(1);
}
