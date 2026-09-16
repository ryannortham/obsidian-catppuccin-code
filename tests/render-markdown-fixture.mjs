import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = join(root, "tests/fixtures/markdown-states.html");
const scenarios = ["latte", "frappe", "macchiato", "mocha", "mochaBlue"];
const chrome = process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const check = process.argv.includes("--check");
const temporary = mkdtempSync(join(tmpdir(), "catppuccin-markdown-"));
const chromeProfile = join(temporary, "chrome");

if (!existsSync(chrome)) throw new Error(`Chrome not found: ${chrome}`);
mkdirSync(join(root, "tests/visual"), { recursive: true });

const waitForFile = async (path) => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (existsSync(path) && statSync(path).size > 0) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error(`Chrome did not render ${path} within 20 seconds`);
};

try {
  for (const scenario of scenarios) {
    const baseline = join(root, `tests/visual/markdown-states-${scenario}.png`);
    const output = check ? join(temporary, `markdown-states-${scenario}.png`) : baseline;
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
      "--window-size=1280,1200",
      `--user-data-dir=${chromeProfile}-${scenario}`,
      `--screenshot=${output}`,
      `${pathToFileURL(fixture).href}?scenario=${scenario}`,
    ], { stdio: "ignore" });
    await waitForFile(output);
    child.kill("SIGTERM");
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
    if (child.exitCode === null) child.kill("SIGKILL");
    spawnSync("pkill", ["-TERM", "-f", `${chromeProfile}-${scenario}`], { stdio: "ignore" });
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
    spawnSync("pkill", ["-KILL", "-f", `${chromeProfile}-${scenario}`], { stdio: "ignore" });
    if (check) {
      if (!existsSync(baseline)) throw new Error(`Missing visual baseline: ${baseline}`);
      if (!readFileSync(output).equals(readFileSync(baseline))) {
        throw new Error(`Visual ${scenario} fixture differs; run pnpm run test:visual:markdown and review the PNG`);
      }
    }
    console.log(`${check ? "Verified" : "Rendered"} ${check ? baseline : output}`);
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
