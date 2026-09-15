import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = join(root, "tests/fixtures/workbench-states.html");
const baseline = join(root, "tests/visual/workbench-states.png");
const chrome =
  process.env.CHROME_BIN ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const check = process.argv.includes("--check");
const temporary = mkdtempSync(join(tmpdir(), "catppuccin-workbench-"));
const chromeProfile = join(temporary, "chrome");
const output = check ? join(temporary, "workbench-states.png") : baseline;

if (!existsSync(chrome)) throw new Error(`Chrome not found: ${chrome}`);
mkdirSync(dirname(output), { recursive: true });

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

try {
  rmSync(output, { force: true });
  const child = spawn(chrome, [
    "--headless=new",
    "--disable-background-networking",
    "--disable-extensions",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-default-browser-check",
    "--no-first-run",
    "--force-device-scale-factor=1",
    "--window-size=1440,1180",
    `--user-data-dir=${chromeProfile}`,
    `--screenshot=${output}`,
    pathToFileURL(fixture).href,
  ], { stdio: "ignore" });

  let rendered = false;
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (existsSync(output) && statSync(output).size > 0) {
      rendered = true;
      break;
    }
    await delay(100);
  }

  child.kill("SIGTERM");
  await delay(250);
  if (child.exitCode === null) child.kill("SIGKILL");
  spawnSync("pkill", ["-TERM", "-f", chromeProfile], { stdio: "ignore" });
  await delay(250);
  spawnSync("pkill", ["-KILL", "-f", chromeProfile], { stdio: "ignore" });
  if (!rendered) throw new Error("Chrome did not render the visual fixture within 20 seconds");

  if (check) {
    if (!existsSync(baseline)) throw new Error(`Missing visual baseline: ${baseline}`);
    const actual = readFileSync(output);
    const expected = readFileSync(baseline);
    if (!actual.equals(expected)) {
      throw new Error("Visual fixture differs; run pnpm run test:visual and review the PNG");
    }
  }

  console.log(`${check ? "Verified" : "Rendered"} ${check ? baseline : output}`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
