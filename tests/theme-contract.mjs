import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const interfaceSource = readFileSync(
  join(root, "scss/layout/_interface.scss"),
  "utf8",
);
const pluginSource = readFileSync(
  join(root, "scss/vendors/_plugin-compatibility.scss"),
  "utf8",
);
const paletteSource = readFileSync(
  join(root, "scss/base/_ctp-style-settings.scss"),
  "utf8",
);
const compiledCss = readFileSync(join(root, "theme.css"), "utf8");
const fixtureSource = readFileSync(
  join(root, "tests/fixtures/interface-states.html"),
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
assert(manifest.name === "Catppuccin Code", "Manifest must use the public theme name");
assert(manifest.author === "Ryan Northam", "Manifest must identify the theme author");
assert(/^\d+\.\d+\.\d+$/.test(manifest.version), "Manifest version must use x.y.z SemVer");
assert(
  manifest.repo === "ryannortham/obsidian-catppuccin-code",
  "Manifest must point to the renamed GitHub repository",
);
assert(
  manifest.screenshot === "screenshot.png",
  "Manifest must point to the bundled preview image",
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

function lightenHex(hex, amount) {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
  const max = Math.max(...channels);
  const min = Math.min(...channels);
  let hue = 0;
  let saturation = 0;
  let lightness = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === channels[0]) hue = (channels[1] - channels[2]) / delta + (channels[1] < channels[2] ? 6 : 0);
    if (max === channels[1]) hue = (channels[2] - channels[0]) / delta + 2;
    if (max === channels[2]) hue = (channels[0] - channels[1]) / delta + 4;
    hue /= 6;
  }

  lightness = Math.min(1, lightness + amount);
  const hueChannel = (p, q, value) => {
    let channel = value;
    if (channel < 0) channel += 1;
    if (channel > 1) channel -= 1;
    if (channel < 1 / 6) return p + (q - p) * 6 * channel;
    if (channel < 1 / 2) return q;
    if (channel < 2 / 3) return p + (q - p) * (2 / 3 - channel) * 6;
    return p;
  };
  const output = saturation === 0
    ? [lightness, lightness, lightness]
    : [hue + 1 / 3, hue, hue - 1 / 3].map((value) => {
      const q = lightness < 0.5
        ? lightness * (1 + saturation)
        : lightness + saturation - lightness * saturation;
      return hueChannel(2 * lightness - q, q, value);
    });
  return `#${output.map((channel) => Math.round(channel * 255).toString(16).padStart(2, "0")).join("")}`;
}

function mixHex(first, second) {
  const channels = [1, 3, 5].map((index) => Math.round(
    (Number.parseInt(first.slice(index, index + 2), 16) +
      Number.parseInt(second.slice(index, index + 2), 16)) / 2,
  ));
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
  const value = declaration(interfaceSource, name).toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(value)) return value;
  const opaque = value.match(/^rgb\(var\(--(ctp-[a-z0-9-]+)\)\)$/);
  if (opaque) return paletteHex(opaque[1], palette);
  const alpha = value.match(/^rgb\(var\(--(ctp-[a-z0-9-]+)\),\s*(\d+)%\)$/);
  if (alpha) {
    const channel = Math.round(Number(alpha[2]) * 255 / 100)
      .toString(16)
      .padStart(2, "0");
    return `${paletteHex(alpha[1], palette)}${channel}`;
  }
  const lightened = value.match(
    /^hsl\(from rgb\(var\(--(ctp-[a-z0-9-]+)\)\) h s calc\(l \+ (\d+)\)\)$/,
  );
  if (lightened) return lightenHex(paletteHex(lightened[1], palette), Number(lightened[2]) / 100);
  throw new Error(`Unsupported role expression for --${name}: ${value}`);
}

const roleTokens = {
  "ctp-icon-foreground": "ctp-mauve",
  "ctp-focus-border": "ctp-mauve",
  "ctp-list-selection-background": "ctp-surface0",
  "ctp-list-hover-background": "ctp-surface0",
  "ctp-hover-background": "ctp-base",
  "ctp-tree-guide-active": "ctp-overlay2",
  "ctp-tree-guide-inactive": "ctp-surface1",
  "ctp-tab-active-background": "ctp-base",
  "ctp-tab-active-foreground": "ctp-mauve",
  "ctp-close-hover-background": "ctp-surface1",
};

const resolved = {};
for (const [flavor, palette] of Object.entries(palettes)) {
  resolved[flavor] = {};
  for (const [role, token] of Object.entries(roleTokens)) {
    const expected = paletteHex(token, palette);
    const alphaByRole = { "ctp-list-hover-background": 50 };
    const alpha = alphaByRole[role];
    const expectedWithAlpha = role === "ctp-hover-background"
      ? lightenHex(expected, 0.05)
      : alpha
        ? `${expected}${Math.round(alpha * 255 / 100).toString(16).padStart(2, "0")}`
        : expected;
    const actual = resolveRole(role, palette);
    assert(actual === expectedWithAlpha, `${flavor} ${role} is ${actual}; expected ${expectedWithAlpha}`);
    resolved[flavor][role] = actual;
  }
}

assert(
  /body\.theme-dark,\s*body\.theme-light\s*\{/.test(interfaceSource),
  "interface rules must apply to both light and dark theme bodies",
);
assert(
  !/css-settings-manager|\.ctp-(?:mocha|frappe|macchiato|latte)/.test(interfaceSource) &&
    !/css-settings-manager|\.ctp-(?:mocha|frappe|macchiato|latte)/.test(pluginSource),
  "interface boundaries must not gate on Style Settings or a single flavor",
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
  resolveRole("ctp-list-selection-background") === paletteHex("ctp-surface0"),
  "Selections must use the active flavor's Surface0",
);
assert(
  declaration(interfaceSource, "ctp-tab-active-background") ===
    "rgb(var(--ctp-base))" &&
    declaration(interfaceSource, "ctp-tab-inactive-background") ===
      "color-mix(\n    in srgb,\n    var(--background-secondary) 50%,\n    rgb(var(--ctp-base)) 50%\n  )" &&
    declaration(interfaceSource, "ctp-tab-strip-background") ===
      "var(--background-secondary)" &&
    mixHex(paletteHex("ctp-mantle"), paletteHex("ctp-base")) === "#1b1b2a",
  "Opaque editor tabs must use Mantle, the Mantle/Base midpoint, and unchanged Base",
);
assert(
  !/&\.is-translucent:not\(\.is-fullscreen\)\s*\{[^}]*--ctp-tab-(?:strip|inactive)-background:/s.test(
    interfaceSource,
  ),
  "Translucency must not change the editor-tab strip or inactive-tab roles",
);
assert(
  declaration(interfaceSource, "ctp-hover-background") ===
    "hsl(from rgb(var(--ctp-base)) h s calc(l + 5))" &&
    resolveRole("ctp-hover-background") === "#28283d",
  "Controls and editor tabs must share Catppuccin VS Code's Base +5% lightness hover",
);
assert(
  /\.workspace-split\.mod-root \.workspace-tab-header-container\s*\{\s*background-color: var\(--ctp-tab-strip-background\)/s.test(
    interfaceSource,
  ),
  "Root editor tab strip must paint the configured no-tab surface",
);
assert(
  /\.workspace\s+\.workspace-split\.mod-root\s+\.workspace-tabs:not\(\.mod-stacked\)[\s\S]*?\.workspace-tab-header-inner-close-button\s*\{\s*display: flex;[\s\S]*?visibility: hidden;/s.test(
    interfaceSource,
  ),
  "Inactive editor tabs must reserve the close-button slot against Obsidian's later rule",
);
assert(
  /\.workspace\s+\.workspace-split\.mod-root\s+\.workspace-tabs:not\(\.mod-stacked\)[\s\S]*?\.workspace-tab-header:not\(\.is-active\):hover[\s\S]*?\.workspace-tab-header-inner-close-button\s*\{\s*pointer-events: auto;\s*visibility: visible;/s.test(
    interfaceSource,
  ),
  "Inactive editor-tab hover must reveal the reserved close-button slot",
);
assert(
  resolveRole("ctp-close-hover-background") !==
    resolveRole("ctp-hover-background"),
  "Close-button hover must be distinguishable from the hovered editor tab",
);
assert(
  declaration(interfaceSource, "ctp-list-secondary-foreground") ===
    "var(--text-muted)",
  "Selected-row icons and counts must use muted text",
);
assert(
  interfaceSource.includes(".workspace-ribbon") &&
    interfaceSource.includes("border-right-color: var(--background-secondary)"),
  "Ribbon vertical seam must match the panel surface",
);
assert(
  interfaceSource.includes("is-translucent:not(.is-fullscreen)") &&
    interfaceSource.includes("--divider-color: transparent") &&
    interfaceSource.includes("--tab-outline-color: transparent") &&
    interfaceSource.includes("border-right-color: transparent"),
  "Translucent workspaces must hide divider strokes",
);
assert(
  interfaceSource.includes(".mod-settings :is(.vertical-tab-header, .vertical-tab-content)") &&
    interfaceSource.includes("border-inline-color: transparent"),
  "Settings navigation edges must not draw a contrasting seam",
);
assert(
  /&\.is-popout-modal \.titlebar\s*\{\s*border-bottom: 0;\s*background-color: var\(--background-primary\);\s*box-shadow: none;/s.test(
    interfaceSource,
  ) &&
    fixtureSource.includes('"is-popout-modal"') &&
    fixtureSource.includes("Settings window titlebar · shared Base surface") &&
    fixtureSource.includes("Community Themes titlebar · shared Base surface"),
  "Detached modal titlebars must share the Settings Base surface without a separator in every translucency state",
);
assert(
  interfaceSource.includes(".status-bar-item.mod-clickable") &&
    interfaceSource.includes(".clickable-icon:not("),
  "Status-bar and icon controls must share the core interface control selectors",
);
assert(
  interfaceSource.includes('.workspace-leaf-content[data-type="outline"]'),
  "Files and Outline must share the core nested-tree guide contract",
);
assert(
  interfaceSource.includes(
    ":is(.workspace-split.mod-sidedock, .nav-files-container) .tree-item-self",
  ) &&
    interfaceSource.includes(
      ":is(.workspace-split.mod-sidedock, .nav-files-container) .tree-item-self.is-clickable:not(.is-active, .is-selected):hover",
    ),
  "Mobile file-tree rows must share the interface selection and hover contract",
);
assert(
  interfaceSource.includes(".mod-settings .vertical-tab-nav-item") &&
    interfaceSource.includes(".mod-settings .horizontal-tab-nav-item") &&
    interfaceSource.includes("--nav-item-radius: 0"),
  "Desktop and mobile Settings navigation must share square interface list rows",
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
  /:is\(\.collapse-icon, \.collapse-icon svg\)\s*\{\s*--icon-color: var\(--ctp-icon-foreground\);\s*color: var\(--ctp-icon-foreground\);/s.test(
    interfaceSource,
  ),
  "Files and Outline disclosure chevrons must use the shared Mauve icon role",
);
assert(
  interfaceSource.includes(
    "--background-modifier-hover: var(--ctp-hover-background)",
  ),
  "Core controls must use the shared interface hover surface",
);
assert(
  !/--ctp-(?:control|tab)-hover-background/.test(interfaceSource) &&
    /:where\(:is\(#\{\$ctp-control-selectors\}\)\)[\s\S]*?background-color: var\(--ctp-hover-background\)/.test(
      interfaceSource,
    ) &&
    /\.workspace-split\.mod-sidedock \.workspace-tab-header[\s\S]*?background-color: var\(--ctp-hover-background\)/.test(
      interfaceSource,
    ) &&
    /\.workspace-split\.mod-root[\s\S]*?\.workspace-tab-header:not\(\.is-active\):hover[\s\S]*?background-color: var\(--ctp-hover-background\)/.test(
      interfaceSource,
    ),
  "Core controls, sidebar tabs, and editor tabs must consume one shared hover token",
);
assert(
  interfaceSource.includes(
    ":is(.workspace-tab-header-tab-list, .workspace-tab-header-new-tab, .sidebar-toggle-button)",
  ) &&
    interfaceSource.includes("inline-size: var(--ctp-control-size)") &&
    interfaceSource.includes("block-size: var(--ctp-control-size)"),
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
  /\.clickable-icon:not\([^)]*\.modal-close-button[^)]*\.mod-close/.test(interfaceSource),
  "Shared control hover must leave close and destructive buttons to their semantic rules",
);
assert(!interfaceSource.includes("!important"), "Core interface rules must not use !important");
assert(
  !/agent-client-session-manager|metadata-menu/.test(interfaceSource),
  "Plugin contracts leaked into the core interface partial",
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
  "Legacy vertical tab hover rules must not override the interface tab contract",
);
assert(
  !/\.workspace-tab-header-inner-close-button:hover\s*\{\s*background-color:\s*rgb\(var\(--ctp-red\)/s.test(
    compiledCss,
  ),
  "Legacy red tab-close hover must not override the shared close-surface role",
);
assert(
  interfaceSource.includes(".workspace-tab-header-inner-close-button:hover") &&
    interfaceSource.includes(
      "background-color: var(--ctp-close-hover-background)",
    ),
  "Root tab close-button hover must use the shared close-surface role",
);
assert(
  !/background(?:-color)?:[^;]*(?:ctp-pink|ctp-red)/.test(interfaceSource),
  "Core interface rules contain a pink or red background fill",
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
  "--ctp-tab-strip-background: var(--background-secondary)",
  "--ctp-tab-inactive-background: color-mix(\n    in srgb,\n    var(--background-secondary) 50%,\n    rgb(var(--ctp-base)) 50%\n  )",
  "--ctp-hover-background: hsl(from rgb(var(--ctp-base)) h s calc(l + 5))",
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
  "body.theme-dark.is-popout-modal .titlebar",
  "background-color: var(--background-primary)",
  "inline-size: var(--ctp-control-size)",
  "--slider-thumb-radius: var(--slider-thumb-height)",
  "--slider-fill-background: rgb(var(--ctp-green))",
  "--slider-track-background: var(--background-modifier-border)",
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
assert(
  /--slider-thumb-radius:\s*var\(--slider-thumb-height\);/.test(appVariables),
  "Slider thumb radius must preserve Obsidian's pill geometry",
);
assert(
  /--slider-fill-background:\s*rgb\(var\(--ctp-green\)\);/.test(appVariables),
  "Slider fill must use Catppuccin Green",
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
