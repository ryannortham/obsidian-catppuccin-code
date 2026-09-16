import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
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
const fixtureSource = readFileSync(
  join(root, "tests/fixtures/workbench-states.html"),
  "utf8",
);
const searchSource = readFileSync(join(root, "scss/components/_search.scss"), "utf8");
const legacyNavigationSources = [
  "scss/layout/_sidebar.scss",
  "scss/pages/_settings.scss",
  "scss/themes/_full-palette.scss",
].map((path) => readFileSync(join(root, path), "utf8"));
const coreControlSources = [
  "scss/components/_icons.scss",
  "scss/pages/_canvas.scss",
].map((path) => readFileSync(join(root, path), "utf8"));
const interactionSources = [
  "scss/components/_icons.scss",
  "scss/themes/_full-palette.scss",
  "scss/pages/_canvas.scss",
  "scss/vendors/_plugins.scss",
].map((path) => readFileSync(join(root, path), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
assert(
  existsSync(join(root, "screenshot.png")),
  "Theme package is missing the Obsidian Community themes preview screenshot.png",
);
assert(
  manifest.repo && manifest.screenshot === "assets/screenshot.png",
  "Manifest must provide the Community themes preview repository and screenshot path",
);

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

const paletteMarkers = {
  latte: ".theme-light,\n.theme-light.ctp-latte",
  frappe: ".theme-dark.ctp-frappe",
  macchiato: ".theme-dark.ctp-macchiato",
  mocha: ".theme-dark,\n.theme-dark.ctp-mocha",
};

function paletteBlock(marker) {
  const start = paletteSource.indexOf(`${marker} {`);
  assert(start >= 0, `Missing ${marker} palette block`);
  const end = paletteSource.indexOf("\n}", start);
  return paletteSource.slice(start, end + 2);
}

const palettes = Object.fromEntries(
  Object.entries(paletteMarkers).map(([flavor, marker]) => [flavor, paletteBlock(marker)]),
);
const mochaPalette = palettes.mocha;

function paletteHex(name, palette = mochaPalette) {
  return rgbToHex(declaration(palette, name));
}

function resolveRole(name, palette = mochaPalette) {
  const value = declaration(workbenchSource, name).toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(value)) return value;
  const opaque = value.match(/^rgb\(var\(--(ctp-[a-z0-9-]+)\)\)$/);
  if (opaque) return paletteHex(opaque[1], palette);
  const alpha = value.match(/^rgb\(var\(--(ctp-[a-z0-9-]+)\),\s*50%\)$/);
  if (alpha) return `${paletteHex(alpha[1], palette)}80`;
  throw new Error(`Unsupported role expression for --${name}: ${value}`);
}

const roleTokens = {
  "ctp-workbench-icon-foreground": "ctp-mauve",
  "ctp-workbench-focus-border": "ctp-mauve",
  "ctp-workbench-list-selection-background": "ctp-surface0",
  "ctp-workbench-list-hover-background": "ctp-surface0",
  "ctp-workbench-tree-guide-active": "ctp-overlay2",
  "ctp-workbench-tree-guide-inactive": "ctp-surface1",
  "ctp-workbench-tab-active-background": "ctp-base",
  "ctp-workbench-tab-inactive-background": "ctp-base",
  "ctp-workbench-tab-hover-background": "ctp-base",
  "ctp-workbench-tab-active-foreground": "ctp-mauve",
  "ctp-workbench-close-hover-background": "ctp-surface1",
};

const resolved = {};
for (const [flavor, palette] of Object.entries(palettes)) {
  resolved[flavor] = {};
  for (const [role, token] of Object.entries(roleTokens)) {
    const expected = paletteHex(token, palette);
  const expectedWithAlpha = [
    "ctp-workbench-list-hover-background",
    "ctp-workbench-tab-inactive-background",
  ].includes(role)
      ? `${expected}80`
      : expected;
    const actual = resolveRole(role, palette);
    assert(actual === expectedWithAlpha, `${flavor} ${role} is ${actual}; expected ${expectedWithAlpha}`);
    resolved[flavor][role] = actual;
  }
}

assert(
  /body\.theme-dark,\s*body\.theme-light\s*\{/.test(workbenchSource),
  "Workbench rules must apply to both light and dark theme bodies",
);
assert(
  !/css-settings-manager|\.ctp-(?:mocha|frappe|macchiato|latte)/.test(workbenchSource) &&
    !/css-settings-manager|\.ctp-(?:mocha|frappe|macchiato|latte)/.test(pluginSource),
  "Workbench boundaries must not gate on Style Settings or a single flavor",
);
assert(
  /css-settings-manager/.test(fixtureSource) &&
    /ctp-mocha/.test(fixtureSource) &&
    /ctp-full-palette/.test(fixtureSource) &&
    /ctp-accent-blue/.test(fixtureSource) &&
    /scenarios\s*=/.test(fixtureSource),
  "Visual fixture must exercise the real Style Settings flavor and accent classes",
);

assert(
  resolveRole("ctp-workbench-list-selection-background") === paletteHex("ctp-surface0"),
  "Selections must use the active flavor's Surface0",
);
assert(
  declaration(workbenchSource, "ctp-workbench-tab-active-background") ===
    "rgb(var(--ctp-base))" &&
    declaration(workbenchSource, "ctp-workbench-tab-inactive-background") ===
      "rgb(var(--ctp-base), 50%)",
  "Editor tabs must keep active Base above a subdued Base-over-Mantle inactive tier",
);
assert(
  declaration(workbenchSource, "ctp-workbench-tab-hover-background") ===
    declaration(workbenchSource, "ctp-workbench-tab-active-background"),
  "Editor-tab hover must not be brighter than the active tab",
);
assert(
  resolveRole("ctp-workbench-close-hover-background") !==
    resolveRole("ctp-workbench-tab-hover-background"),
  "Close-button hover must be distinguishable from the hovered editor tab",
);
assert(
  declaration(workbenchSource, "ctp-workbench-list-secondary-foreground") ===
    "var(--text-muted)",
  "Selected-row icons and counts must use muted text",
);
assert(
  workbenchSource.includes(".workspace-ribbon") &&
    workbenchSource.includes("border-right-color: var(--background-secondary)"),
  "Ribbon vertical seam must match the panel surface",
);
assert(
  workbenchSource.includes("is-translucent:not(.is-fullscreen)") &&
    workbenchSource.includes("--divider-color: transparent") &&
    workbenchSource.includes("--tab-outline-color: transparent") &&
    workbenchSource.includes("border-right-color: transparent"),
  "Translucent workspaces must hide divider strokes",
);
assert(
  workbenchSource.includes(".mod-settings :is(.vertical-tab-header, .vertical-tab-content)") &&
    workbenchSource.includes("border-inline-color: transparent"),
  "Settings navigation edges must not draw a contrasting seam",
);
assert(
  workbenchSource.includes(".status-bar-item.mod-clickable") &&
    workbenchSource.includes(".clickable-icon:not("),
  "Status-bar and icon controls must share the core workbench control selectors",
);
assert(
  workbenchSource.includes('.workspace-leaf-content[data-type="outline"]'),
  "Files and Outline must share the core nested-tree guide contract",
);
assert(
  workbenchSource.includes(
    ":is(.workspace-split.mod-sidedock, .nav-files-container) .tree-item-self",
  ) &&
    workbenchSource.includes(
      ":is(.workspace-split.mod-sidedock, .nav-files-container) .tree-item-self.is-clickable:not(.is-active, .is-selected):hover",
    ),
  "Mobile file-tree rows must share the workbench selection and hover contract",
);
assert(
  workbenchSource.includes(".mod-settings .vertical-tab-nav-item") &&
    workbenchSource.includes(".mod-settings .horizontal-tab-nav-item") &&
    workbenchSource.includes("--nav-item-radius: 0"),
  "Desktop and mobile Settings navigation must share square workbench list rows",
);
assert(
  legacyNavigationSources.every(
    (source) => !/(?:horizontal|vertical)-tab-nav-item(?:\.is-active|:hover)/.test(source),
  ),
  "Legacy accent-driven Settings navigation states must be removed from canonical partials",
);
assert(
  legacyNavigationSources.every(
    (source) =>
      !/\.nav-(?:file|folder)-title(?:\.is-active|:hover)/.test(source) &&
      !/\.tree-item-self\.is-(?:active|selected)\s*\{/.test(source),
  ),
  "Legacy accent-driven file-tree states must be removed from canonical partials",
);
assert(
  /:is\(\.collapse-icon, \.collapse-icon svg\)\s*\{\s*--icon-color: var\(--ctp-workbench-icon-foreground\);\s*color: var\(--ctp-workbench-icon-foreground\);/s.test(
    workbenchSource,
  ),
  "Files and Outline disclosure chevrons must use the shared Mauve icon role",
);
assert(
  workbenchSource.includes(
    "--background-modifier-hover: var(--ctp-workbench-list-hover-background)",
  ),
  "Core button hover must use the shared subtle workbench surface",
);
assert(
  workbenchSource.includes(
    "--ctp-workbench-control-hover-background: rgb(var(--ctp-surface0), 25%)",
  ) &&
    workbenchSource.includes(
      "background-color: var(--ctp-workbench-control-hover-background)",
    ),
  "Toolbar controls must use a subdued shared hover surface",
);
assert(
  workbenchSource.includes(
    ":is(.workspace-tab-header-tab-list, .workspace-tab-header-new-tab, .sidebar-toggle-button)",
  ) &&
    workbenchSource.includes("inline-size: var(--ctp-workbench-control-size)") &&
    workbenchSource.includes("block-size: var(--ctp-workbench-control-size)"),
  "Top-bar controls must share one normalized hit-target size",
);
assert(
  coreControlSources.every(
    (source) =>
      !/(?:--background-modifier-hover|--interactive-hover)\s*:\s*rgb\(var\(--ctp-accent\)\)/.test(
        source,
      ),
  ),
  "Core controls must not define one-off accent hover fills",
);
assert(
  /\.clickable-icon:not\([^)]*\.modal-close-button[^)]*\.mod-close/.test(workbenchSource),
  "Shared control hover must leave close and destructive buttons to their semantic rules",
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
  /\.workspace-tab-header \.metadata-menu\.fileclass-icon,[\s\S]*?\.workspace-tab-header \.metadata-menu\.fileclass-icon svg\s*\{\s*color: rgb\(var\(--ctp-blue\)\);/.test(
    pluginSource,
  ),
  "Metadata Menu file-class icons must retain their dedicated Blue role",
);
assert(
  !/\.mod-vertical \.workspace-tab-header:not\(\.is-active\):hover/.test(compiledCss),
  "Legacy vertical tab hover rules must not override the workbench tab contract",
);
assert(
  !/\.workspace-tab-header-inner-close-button:hover\s*\{\s*background-color:\s*rgb\(var\(--ctp-red\)/s.test(
    compiledCss,
  ),
  "Legacy red tab-close hover must not override the shared close-surface role",
);
assert(
  workbenchSource.includes(".workspace-tab-header-inner-close-button:hover") &&
    workbenchSource.includes(
      "background-color: var(--ctp-workbench-close-hover-background)",
    ),
  "Root tab close-button hover must use the shared close-surface role",
);
assert(
  !/background(?:-color)?:[^;]*(?:ctp-pink|ctp-red)/.test(workbenchSource),
  "Core workbench rules contain a pink or red background fill",
);
assert(
  interactionSources.every((source) => !source.includes("var(--ctp-pink)")),
  "Interactive component partials must not use the Pink palette token",
);
assert(
  !/\.search-result-file-match:hover \.search-result-file-matched-text\s*\{\s*background-color:\s*rgb\(var\(--ctp-rosewater/.test(searchSource),
  "Search-match hover must not restore a pink highlight fill",
);

const requiredCompiledFragments = [
  "--ctp-workbench-tab-hover-background: rgb(var(--ctp-base))",
  ".status-bar-item.mod-clickable",
  ":is(.workspace-split.mod-sidedock, .nav-files-container) .tree-item-self",
  ".mod-settings .vertical-tab-nav-item",
  ".mod-settings .horizontal-tab-nav-item",
  ".tree-item-self:is(.is-active, .is-selected) :is(.tree-item-icon",
  ".workspace-leaf-content[data-type=outline]",
  ".workspace-split.mod-root .workspace-tab-header",
  ".workspace-leaf-content[data-type=backlink]",
  ".agent-client-session-manager .tree-item-self",
  ".workspace-tab-header .metadata-menu.fileclass-icon",
  "body.theme-dark .workspace-ribbon",
  "border-right-color: var(--background-secondary)",
  "--divider-color: transparent",
  "border-right-color: transparent",
  ".mod-settings :is(.vertical-tab-header, .vertical-tab-content)",
  "--ctp-workbench-control-hover-background: rgb(var(--ctp-surface0), 25%)",
  "inline-size: var(--ctp-workbench-control-size)",
];
for (const fragment of requiredCompiledFragments) {
  assert(compiledCss.includes(fragment), `Compiled theme is missing: ${fragment}`);
}

function collectScssFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? collectScssFiles(path)
      : entry.name.endsWith(".scss") ? [path] : [];
  });
}

const paletteColors = new Set(
  Object.values(palettes).flatMap((palette) => [
    ...[...palette.matchAll(/--ctp-[\w-]+:\s*(\d{1,3},\s*\d{1,3},\s*\d{1,3});/g)]
      .map((match) => rgbToHex(match[1]).toLowerCase()),
    ...[...palette.matchAll(/--hex-[\w-]+:\s*(#[0-9a-f]{6});/gi)]
      .map((match) => match[1].toLowerCase()),
  ]),
);
const auditedSources = collectScssFiles(join(root, "scss"))
  .filter((path) => !path.endsWith("_ctp-style-settings.scss"));
const paletteLiteralUses = [];
for (const path of auditedSources) {
  const source = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of source.matchAll(/#[0-9a-f]{3,4}(?:[0-9a-f]{2})?(?:[0-9a-f]{2})?\b/gi)) {
    const color = match[0].toLowerCase();
    assert(paletteColors.has(color), `${path} uses non-palette color literal ${color}`);
    paletteLiteralUses.push(color);
  }
  for (const match of source.matchAll(/(?:fill|stroke)="%23([0-9a-f]{6})"/gi)) {
    const color = `#${match[1].toLowerCase()}`;
    assert(paletteColors.has(color), `${path} uses non-palette SVG color literal ${color}`);
    paletteLiteralUses.push(color);
  }
  assert(
    !/\b(?:rgba?|hsla?)\(\s*(?:\d|\.\d)/i.test(source),
    `${path} contains a numeric RGB/HSL color literal instead of a palette token`,
  );
  assert(
    !/(?:fill|stroke)\s*=\s*["'](?:white|black)\b/i.test(source) &&
      !/(?:^|[;{\s])(?:color|background(?:-color)?|border-color|outline-color|fill|stroke)\s*:\s*(?:white|black)\b/im.test(source),
    `${path} contains a named white/black color instead of a palette value`,
  );
}

const appVariables = readFileSync(join(root, "scss/base/_app-variables.scss"), "utf8");
assert(
  /Accent HSL values: overridden by each Catppuccin flavor block/.test(appVariables),
  "Accent channels must be documented as flavor-relative overrides",
);
assert(paletteLiteralUses.length > 0, "Expected palette-valued SVG literals for checklist glyphs");

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

const contrastChecks = {};
for (const [flavor, palette] of Object.entries(palettes)) {
  const text = paletteHex("ctp-text", palette);
  const mauve = paletteHex("ctp-mauve", palette);
  const surface0 = paletteHex("ctp-surface0", palette);
  const base = paletteHex("ctp-base", palette);
  contrastChecks[flavor] = {
    "normal text / selected row": contrast(text, surface0),
    "mauve / active tab": contrast(mauve, base),
    "mauve / hovered tab": contrast(mauve, surface0),
  };
  for (const [label, ratio] of Object.entries(contrastChecks[flavor])) {
    const minimum = label === "normal text / selected row" ? 4.5 : 3;
    assert(
      ratio >= minimum,
      `${flavor} ${label} contrast is ${ratio.toFixed(2)}; expected at least ${minimum}`,
    );
  }
}

console.log(
  JSON.stringify(
    {
      roleTokens,
      resolved,
      contrast: Object.fromEntries(
        Object.entries(contrastChecks).map(([flavor, checks]) => [
          flavor,
          Object.fromEntries(Object.entries(checks).map(([label, ratio]) => [label, ratio.toFixed(2)])),
        ]),
      ),
      colorAudit: {
        scssFiles: auditedSources.length,
        paletteLiteralUses: paletteLiteralUses.length,
        result: "pass",
      },
      result: "pass",
    },
    null,
    2,
  ),
);
