import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const paletteSource = read("scss/base/_ctp-style-settings.scss");
const appVariableSource = read("scss/base/_app-variables.scss");
const semanticSource = read("scss/base/_semantic-roles.scss");
const interfaceSource = read("scss/layout/_interface.scss");
const iconsSource = read("scss/components/_icons.scss");
const pluginSource = read("scss/vendors/_plugins.scss");
const searchSource = read("scss/components/_search.scss");
const linksSource = read("scss/components/_links.scss");
const inputsSource = read("scss/components/_inputs.scss");
const settingsPageSource = read("scss/pages/_settings.scss");
const mainSource = read("scss/main.scss");
const interfaceFixture = read("tests/fixtures/interface-states.html");
const compiledCss = read("theme.css");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function block(source, marker) {
  const start = source.indexOf(`${marker} {`);
  assert(start >= 0, `Missing ${marker}`);
  const end = source.indexOf("\n}", start);
  assert(end >= 0, `Unclosed ${marker}`);
  return source.slice(start, end + 2);
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

const fontSettingsBlock = paletteSource.match(
  /\/\* @settings\nname: "Catppuccin: Font Styles"[\s\S]*?\*\//,
)?.[0];
assert(paletteSource.includes('name: "Catppuccin: Accents"'), "Accent settings section must use the concise name");
assert(!paletteSource.includes("Catppuccin: Catppuccin Accents"), "Duplicated Catppuccin accent label must be removed");
assert(!paletteSource.includes("catppuccin-interface-styles"), "Empty Interface Styles section must be removed");
assert(fontSettingsBlock?.includes("id: ctp-bold-folder-title"), "Bold folder title must live under Font Styles");

const canonical = {
  latte: "dc8a78 dd7878 ea76cb 8839ef d20f39 e64553 fe640b df8e1d 40a02b 179299 04a5e5 209fb5 1e66f5 7287fd 4c4f69 5c5f77 6c6f85 7c7f93 8c8fa1 9ca0b0 acb0be bcc0cc ccd0da eff1f5 e6e9ef dce0e8",
  frappe: "f2d5cf eebebe f4b8e4 ca9ee6 e78284 ea999c ef9f76 e5c890 a6d189 81c8be 99d1db 85c1dc 8caaee babbf1 c6d0f5 b5bfe2 a5adce 949cbb 838ba7 737994 626880 51576d 414559 303446 292c3c 232634",
  macchiato: "f4dbd6 f0c6c6 f5bde6 c6a0f6 ed8796 ee99a0 f5a97f eed49f a6da95 8bd5ca 91d7e3 7dc4e4 8aadf4 b7bdf8 cad3f5 b8c0e0 a5adcb 939ab7 8087a2 6e738d 5b6078 494d64 363a4f 24273a 1e2030 181926",
  mocha: "f5e0dc f2cdcd f5c2e7 cba6f7 f38ba8 eba0ac fab387 f9e2af a6e3a1 94e2d5 89dceb 74c7ec 89b4fa b4befe cdd6f4 bac2de a6adc8 9399b2 7f849c 6c7086 585b70 45475a 313244 1e1e2e 181825 11111b",
};
const tokenNames = [
  "rosewater", "flamingo", "pink", "mauve", "red", "maroon", "peach", "yellow",
  "green", "teal", "sky", "sapphire", "blue", "lavender", "text", "subtext1",
  "subtext0", "overlay2", "overlay1", "overlay0", "surface2", "surface1", "surface0",
  "base", "mantle", "crust",
];
const markers = {
  latte: ".theme-light,\n.theme-light.ctp-latte",
  frappe: ".theme-dark.ctp-frappe",
  macchiato: ".theme-dark.ctp-macchiato",
  mocha: ".theme-dark,\n.theme-dark.ctp-mocha",
};

const palettes = {};
for (const [flavor, marker] of Object.entries(markers)) {
  const flavorBlock = block(paletteSource, marker);
  const expected = canonical[flavor].split(" ");
  palettes[flavor] = {};
  tokenNames.forEach((name, index) => {
    const actual = rgbToHex(declaration(flavorBlock, `ctp-${name}`)).slice(1);
    assert(actual === expected[index], `${flavor} ${name} is ${actual}; expected ${expected[index]}`);
    palettes[flavor][name] = `#${actual}`;
  });
}

for (const [alias, token] of Object.entries({
  red: "red", orange: "peach", yellow: "yellow", green: "green", cyan: "sky",
  blue: "blue", purple: "mauve", pink: "pink",
})) {
  assert(declaration(semanticSource, `color-${alias}-rgb`) === `var(--ctp-${token})`, `${alias} RGB alias must use ${token}`);
  assert(declaration(semanticSource, `color-${alias}`) === `rgb(var(--color-${alias}-rgb))`, `${alias} complete alias must match its RGB alias`);
}

const semanticRoles = {
  "background-primary": "rgb(var(--ctp-base))",
  "background-secondary": "rgb(var(--ctp-mantle))",
  "background-secondary-alt": "rgb(var(--ctp-crust))",
  "ctp-control-background": "rgb(var(--ctp-surface0))",
  "ctp-list-selection-background": "rgb(var(--ctp-surface0))",
  "ctp-list-hover-background": "rgb(var(--ctp-surface0), 50%)",
  "ctp-search-match-background": "rgb(var(--ctp-sky), 30%)",
  "ctp-search-match-current-background": "rgb(var(--ctp-red), 30%)",
  "text-normal": "rgb(var(--ctp-text))",
  "text-muted": "rgb(var(--ctp-subtext0))",
  "text-faint": "rgb(var(--ctp-overlay1))",
  "color-accent-2": "hsl(from rgb(var(--ctp-accent)) h s calc(l + 7))",
  "text-accent": "rgb(var(--ctp-accent))",
  "text-accent-hover": "var(--color-accent-2)",
  "text-highlight-bg": "rgb(var(--ctp-yellow), 28%)",
  "caret-color": "rgb(var(--ctp-rosewater))",
};
for (const [role, expected] of Object.entries(semanticRoles)) {
  assert(declaration(semanticSource, role) === expected, `--${role} must be ${expected}`);
}

const accents = [
  "rosewater", "flamingo", "pink", "mauve", "red", "maroon", "peach", "yellow",
  "green", "teal", "sky", "sapphire", "blue", "lavender",
];
for (const accent of accents) {
  assert(
    declaration(block(paletteSource, `.ctp-accent-${accent}`), "ctp-accent") === `var(--ctp-${accent})`,
    `${accent} accent class must update --ctp-accent`,
  );
}
assert(/id: catppuccin-theme-accents[\s\S]*?default: ctp-accent-mauve/.test(paletteSource), "Theme accent must default to Mauve");
assert(!paletteSource.includes("Full palette"), "The redundant Full palette option must be removed");
assert(!paletteSource.includes(".ctp-full-palette"), "The obsolete Full palette class must be removed");
assert(
  /\.theme-light:not\(\[class\*="ctp-accent-"\]\),\s*\.theme-dark:not\(\[class\*="ctp-accent-"\]\)[\s\S]*?--ctp-accent: var\(--ctp-mauve\)/.test(semanticSource),
  "Missing or stale accent classes must safely fall back to Mauve",
);
for (const role of ["color-accent", "interactive-accent", "ctp-focus-border", "ctp-icon-foreground"]) {
  assert(declaration(semanticSource, role).includes("ctp-accent") || declaration(semanticSource, role).includes("color-accent"), `--${role} must derive from --ctp-accent`);
}

assert(/--ctp-tab-strip-background:\s*rgb\(var\(--ctp-crust\)\)/.test(interfaceSource), "Editor tab strip must use Crust");
assert(declaration(appVariableSource, "header-height") === "40px", "Global view headers must retain Obsidian stock 40px geometry");
assert(declaration(interfaceSource, "ctp-control-size") === "30px", "Root tab-bar actions must retain their 30px hit area");
assert(/\.workspace-split\.mod-root[\s\S]*?--header-height: 32px/.test(interfaceSource), "Root editor tabs must retain their 32px geometry");
assert(/--ctp-tab-inactive-background:\s*rgb\(var\(--ctp-mantle\)\)/.test(interfaceSource), "Inactive tabs must use Mantle");
assert(/--ctp-tab-active-background:\s*rgb\(var\(--ctp-base\)\)/.test(interfaceSource), "Active tabs must use Base");
assert(/--ctp-tab-inactive-foreground:\s*rgb\(var\(--ctp-overlay0\)\)/.test(interfaceSource), "Inactive tabs must use Overlay0");
assert(/\.workspace-ribbon[\s\S]*?background-color: rgb\(var\(--ctp-crust\)\)/.test(interfaceSource), "Ribbon must use Crust");
assert(/box-shadow: inset 2px 0 0 var\(--ctp-focus-border\)/.test(interfaceSource), "Active ribbon controls must use an accent indicator");
assert(
  /\.workspace-tab-header-container[\s\S]*?border-bottom-color: transparent[\s\S]*?box-shadow: none/.test(interfaceSource),
  "Sidebar headers must preserve stock border spacing without drawing a dark seam",
);
assert(!interfaceSource.includes(".nav-header"), "Theme must not override Obsidian stock nav-header geometry");
assert(!interfaceSource.includes(".nav-buttons-container"), "Theme must not override Obsidian stock nav-button layout");
assert(!interfaceSource.includes(".nav-action-button"), "Theme must not override Obsidian stock nav-action sizing");
assert(!/\.clickable-icon,[\s\S]*?margin: 0 2px/.test(iconsSource), "Generic clickable icons must retain Obsidian stock margin ownership");
assert(!paletteSource.includes("catppuccin-icon-styles"), "Obsolete Icon Styles settings must be removed");
assert(!paletteSource.includes("ctp-icon-hide"), "Obsolete folder-icon setting must be removed");
assert(!iconsSource.includes("nav-folder-title-content::before"), "Generated folder icons must be removed");
assert(!interfaceSource.includes(".tree-item-children"), "Custom tree-guide overlay must be removed");
assert(!interfaceSource.includes("--nav-indentation-guide"), "Theme must not override native tree-guide geometry");
assert(!appVariableSource.includes("--nav-item-white-space"), "Native tree whitespace must remain stock-owned");
assert(!appVariableSource.includes("--nav-item-children-padding-left"), "Native tree child spacing must remain stock-owned");
assert(!appVariableSource.includes("--line-height-tight:"), "Native tree line-height must remain stock-owned");
assert(/--nav-collapse-icon-color: var\(--ctp-icon-foreground\)/.test(interfaceSource), "Native tree chevrons must retain Catppuccin foreground colour");
assert(/--nav-collapse-icon-color-collapsed: var\(--ctp-icon-foreground\)/.test(interfaceSource), "Collapsed tree chevrons must retain Catppuccin foreground colour");
for (const unused of ["better-command-palette", "git-commit-msg", "another-quick-switcher", "omnisearch", "mk-", "fn-is-active", "svelte-q3wqg9", "EA-shortcode"]) {
  assert(!pluginSource.includes(unused), "Unused plugin adapter remains: " + unused);
}
assert(pluginSource.includes(".dataview.inline-field"), "Enabled Dataview compatibility must remain");
assert(
  /:is\(\.workspace-tab-header-tab-list, \.workspace-tab-header-new-tab\)[\s\S]*?block-size: var\(--ctp-control-size\)/.test(interfaceSource),
  "Custom 30px control sizing must remain scoped to root tab-bar actions",
);
assert(
  /\.workspace-tab-header-container[\s\S]*?background-color: var\(--background-secondary\)/.test(interfaceSource),
  "Sidedock header controls must continue the Mantle sidebar surface",
);
assert(
  /\.workspace-split\.mod-root \.workspace-tab-header-container[\s\S]*?padding-inline-start: 0/.test(interfaceSource),
  "Root tabs must start flush with the tab strip",
);
assert(
  /\.workspace-split\.mod-root \.workspace-tab-header-container-inner[\s\S]*?margin-block: 0[\s\S]*?margin-inline-start: 0[\s\S]*?padding-block-start: 0[\s\S]*?padding-inline-start: 0/.test(interfaceSource),
  "Root tab inner container must not reintroduce a leading or upper inset",
);
assert(
  /\.workspace-split\.mod-root \.workspace-tab-header[\s\S]*?&::before,[\s\S]*?&::after[\s\S]*?display: none/.test(interfaceSource),
  "Root tabs must disable Obsidian's curved bottom-corner pseudo-elements",
);
assert(
  /&\.is-active,\s*&\.is-active \.workspace-tab-header-inner \{[\s\S]*?background-color: transparent;/.test(interfaceSource),
  "Active sidebar tabs must be transparent at rest",
);
assert(
  /\.workspace-split\.mod-sidedock \.workspace-tab-header \{[\s\S]*?&:hover,\s*&:hover \.workspace-tab-header-inner \{[\s\S]*?background-color: var\(--ctp-hover-background\)/.test(interfaceSource),
  "Active and inactive sidebar tabs must share the hover background",
);
assert(
  !/\.mod-(?:left|right)-split \.workspace-tab-header\.(?:is-active|has-active-menu)/.test(iconsSource),
  "Sidebar tab state backgrounds must have one owner in the interface partial",
);
assert(interfaceFixture.includes("mod-left-split") && interfaceFixture.includes("mod-right-split"), "Visual coverage must include both sidebars");
assert(
  /workspace-tab-header is-active fixture-hover/.test(interfaceFixture),
  "Visual coverage must include the active sidebar hover state",
);
assert(!/background-color:\s*rgb\(var\(--ctp-accent\)\)/.test(searchSource), "Search rows must not use a solid accent fill");
assert(searchSource.includes("var(--ctp-search-match-background)"), "Search matches must use the search semantic role");
assert(/cm-highlight\.cm-link[\s\S]*?color: var\(--text-normal\)/.test(linksSource), "Highlighted links must remain readable");
assert(declaration(appVariableSource, "link-color") === "rgb(var(--ctp-blue))", "Links must use Blue");
assert(declaration(appVariableSource, "link-color-hover") === "rgb(var(--ctp-sky))", "Link hover must use Sky");
assert(declaration(appVariableSource, "link-external-color-hover") === "rgb(var(--ctp-sky))", "External link hover must use Sky");
assert(declaration(appVariableSource, "callout-warning") === "var(--color-orange)", "Warnings must use Peach through the orange alias");
assert(!inputsSource.includes("rgb(var(--ctp-accent), 70%)"), "Input focus borders must use the full accent color");
assert(/box-shadow: 0 0 0 2px var\(--ctp-focus-border\)/.test(inputsSource), "Input focus must use the focus-border role");
assert(
  /button\.mod-cta[\s\S]*?&:not\(\.clickable-icon\)[\s\S]*?background-color: var\(--interactive-accent\)[\s\S]*?color: var\(--text-on-accent\)[\s\S]*?&:hover[\s\S]*?background-color: var\(--interactive-accent-hover\)/.test(settingsPageSource),
  "Settings CTA buttons must use the selected accent and its hover role",
);

assert(mainSource.includes('@use "base/semantic-roles";'), "Semantic role layer must be compiled");
assert(mainSource.includes('@use "components/syntax";'), "Syntax role layer must be compiled");
assert(mainSource.includes('@use "themes/document-palette";'), "Document palette layer must be compiled");
assert(!mainSource.includes("full-palette"), "The obsolete Full palette partial must not be compiled");
assert(!mainSource.includes('vendors/fonts'), "Font vendor must not be compiled");
assert(!existsSync(join(root, "scss/vendors/_fonts.scss")), "Bundled font source must be removed");
assert(!existsSync(join(root, "obsidian.css")), "Legacy font-bundled artifact must be removed");
assert(!/@font-face|data:font|Vollkorn|Nunito Sans/i.test(compiledCss), "Compiled theme must not bundle or force fonts");
assert(Buffer.byteLength(compiledCss) < 250_000, "Compiled theme unexpectedly exceeds 250 KB");
assert(!/%2311111b/i.test(read("scss/vendors/_checklists.scss")), "Checklist SVGs must not bake in Mocha Crust");

const manifest = JSON.parse(read("manifest.json"));
assert(existsSync(join(root, "screenshot.png")), "Theme package needs screenshot.png");
assert(manifest.name === "Catppuccin Code", "Manifest name is incorrect");
assert(manifest.repo === "ryannortham/obsidian-catppuccin-code", "Manifest repository is incorrect");

function luminance(hex) {
  const values = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}
function contrast(first, second) {
  const [high, low] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}
const contrastReport = {};
for (const [flavor, palette] of Object.entries(palettes)) {
  contrastReport[flavor] = {
    "text/base": contrast(palette.text, palette.base),
    "text/surface0": contrast(palette.text, palette.surface0),
  };
  for (const [pair, ratio] of Object.entries(contrastReport[flavor])) {
    assert(ratio >= 4.5, `${flavor} ${pair} contrast is ${ratio.toFixed(2)}`);
  }
}

console.log(JSON.stringify({
  paletteValues: tokenNames.length * Object.keys(palettes).length,
  accentScenarios: accents.length * Object.keys(palettes).length,
  contrast: Object.fromEntries(Object.entries(contrastReport).map(([flavor, pairs]) => [
    flavor,
    Object.fromEntries(Object.entries(pairs).map(([name, ratio]) => [name, ratio.toFixed(2)])),
  ])),
  compiledBytes: Buffer.byteLength(compiledCss),
  result: "pass",
}, null, 2));
