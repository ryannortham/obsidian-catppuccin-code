import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const referencePath =
  process.env.CATPPUCCIN_VSC_MOCHA ??
  join(
    homedir(),
    ".vscode/extensions/catppuccin.catppuccin-vsc-3.19.0/themes/mocha.json",
  );

const reference = JSON.parse(readFileSync(referencePath, "utf8"));
const workbenchSource = readFileSync(
  join(root, "scss/layout/_workbench.scss"),
  "utf8",
);
const pluginSource = readFileSync(
  join(root, "scss/vendors/_workbench-compatibility.scss"),
  "utf8",
);
const paletteSource = readFileSync(
  join(root, "scss/base/_ctp-style-settings.scss"),
  "utf8",
);
const compiledCss = readFileSync(join(root, "theme.css"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function declaration(source, name) {
  const match = source.match(new RegExp(`--${name}:\\s*([^;]+);`));
  assert(match, `Missing --${name}`);
  return match[1].trim();
}

function rgbToHex(value) {
  const channels = value.split(",").map((channel) => Number(channel.trim()));
  assert(channels.length === 3 && channels.every(Number.isFinite), `Invalid RGB: ${value}`);
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

const mochaStart = paletteSource.indexOf(".theme-dark,\n.theme-dark.ctp-mocha {");
assert(mochaStart >= 0, "Missing Mocha palette block");
const mochaEnd = paletteSource.indexOf("\n}", mochaStart);
const mochaPalette = paletteSource.slice(mochaStart, mochaEnd + 2);

function paletteHex(name) {
  return rgbToHex(declaration(mochaPalette, name));
}

function resolveRole(name) {
  const value = declaration(workbenchSource, name).toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(value)) return value;
  const opaque = value.match(/^rgb\(var\(--(ctp-[a-z0-9-]+)\)\)$/);
  if (opaque) return paletteHex(opaque[1]);
  const alpha = value.match(/^rgb\(var\(--(ctp-[a-z0-9-]+)\),\s*50%\)$/);
  if (alpha) return `${paletteHex(alpha[1])}80`;
  throw new Error(`Unsupported role expression for --${name}: ${value}`);
}

const roles = {
  "ctp-workbench-icon-foreground": "icon.foreground",
  "ctp-workbench-focus-border": "focusBorder",
  "ctp-workbench-list-selection-background": "list.activeSelectionBackground",
  "ctp-workbench-list-hover-background": "list.hoverBackground",
  "ctp-workbench-tree-guide-active": "tree.indentGuidesStroke",
  "ctp-workbench-tree-guide-inactive": "tree.inactiveIndentGuidesStroke",
  "ctp-workbench-tab-active-background": "tab.activeBackground",
  "ctp-workbench-tab-inactive-background": "tab.inactiveBackground",
  "ctp-workbench-tab-hover-background": "tab.hoverBackground",
  "ctp-workbench-tab-active-foreground": "tab.activeForeground",
};

const resolved = {};
for (const [role, token] of Object.entries(roles)) {
  const actual = resolveRole(role);
  const expected = reference.colors[token]?.toLowerCase();
  assert(expected, `VS Code reference is missing ${token}`);
  assert(actual === expected, `${role} is ${actual}; ${token} requires ${expected}`);
  resolved[role] = actual;
}

assert(
  resolveRole("ctp-workbench-list-selection-background") ===
    reference.colors["list.inactiveSelectionBackground"].toLowerCase(),
  "Active and inactive selections must share Surface0",
);
assert(
  resolveRole("ctp-workbench-close-hover-background") === "#313244",
  "Close-button hover must use Surface0",
);
assert(!workbenchSource.includes("!important"), "Core workbench rules must not use !important");
assert(
  !/agent-client-session-manager|metadata-menu/.test(workbenchSource),
  "Plugin contracts leaked into the core workbench partial",
);
assert(
  /agent-client-session-manager/.test(pluginSource) && /metadata-menu/.test(pluginSource),
  "Plugin compatibility selectors are missing from the vendor boundary",
);
assert(
  !/background(?:-color)?:[^;]*(?:ctp-pink|ctp-red)/.test(workbenchSource),
  "Core workbench rules contain a pink or red background fill",
);

const requiredCompiledFragments = [
  "--ctp-workbench-tab-hover-background: #28283d",
  ".workspace-split.mod-sidedock .tree-item-self",
  ".nav-files-container .tree-item-children:has(",
  ".workspace-split.mod-root .workspace-tab-header",
  ".workspace-leaf-content[data-type=backlink]",
  ".agent-client-session-manager .tree-item-self",
  ".workspace-tab-header .metadata-menu.fileclass-icon",
];
for (const fragment of requiredCompiledFragments) {
  assert(compiledCss.includes(fragment), `Compiled theme is missing: ${fragment}`);
}

function hexChannels(hex) {
  const value = hex.slice(1, 7);
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
}

function luminance(hex) {
  const channels = hexChannels(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const high = Math.max(luminance(foreground), luminance(background));
  const low = Math.min(luminance(foreground), luminance(background));
  return (high + 0.05) / (low + 0.05);
}

const text = paletteHex("ctp-text");
const mauve = paletteHex("ctp-mauve");
const surface0 = paletteHex("ctp-surface0");
const base = paletteHex("ctp-base");
const tabHover = resolveRole("ctp-workbench-tab-hover-background");
const contrastChecks = {
  "normal text / selected row": contrast(text, surface0),
  "mauve / active tab": contrast(mauve, base),
  "mauve / hovered tab": contrast(mauve, tabHover),
};
for (const [label, ratio] of Object.entries(contrastChecks)) {
  assert(ratio >= 4.5, `${label} contrast is ${ratio.toFixed(2)}; expected at least 4.5`);
}

console.log(
  JSON.stringify(
    {
      reference: referencePath,
      roles,
      resolved,
      contrast: Object.fromEntries(
        Object.entries(contrastChecks).map(([label, ratio]) => [label, ratio.toFixed(2)]),
      ),
      result: "pass",
    },
    null,
    2,
  ),
);
