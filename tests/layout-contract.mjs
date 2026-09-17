import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const layout = read("scss/layout/_vscode-layout.scss");
const interfaceSource = read("scss/layout/_interface.scss");
const documentPalette = read("scss/themes/_document-palette.scss");
const search = read("scss/components/_search.scss");
const fixture = read("tests/fixtures/interface-states.html");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  /body\.theme-dark\.ctp-vscode-layout,\s*body\.theme-light\.ctp-vscode-layout\s*\{/.test(layout),
  "VS Code layout rules must start behind the positive body gate",
);
assert(layout.includes("--header-height: 32px"), "Enabled layout must provide compact root tabs");
assert(!interfaceSource.includes("--header-height: 32px"), "Shared interface rules must not force compact tabs");
assert(
  /:is\(\.markdown-rendered \.task-list-item, \.markdown-source-view \.HyperMD-task-line\)[\s\S]*?input\[type="checkbox"\]/.test(documentPalette),
  "Checkbox colours must be scoped to document task rows",
);
assert(!/^\s*input\[type="checkbox"\]/m.test(documentPalette), "Checkbox colours must not target every input");
assert(!search.includes("--background-modifier-border-hover"), "Community rows must not override a shared border variable");
assert(!search.includes("--interactive-accent"), "Community rows must not override the active accent variable");
assert(
  /document\.body\.className = \[[\s\S]*?"ctp-vscode-layout"/.test(fixture),
  "Interface fixture resets must explicitly enable the VS Code layout baseline",
);

console.log(JSON.stringify({ result: "pass", checks: 7 }));
