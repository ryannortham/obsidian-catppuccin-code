import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const paletteSource = read("scss/base/_ctp-style-settings.scss");
const appVariableSource = read("scss/base/_app-variables.scss");
const semanticSource = read("scss/base/_semantic-roles.scss");
const interfaceSource = read("scss/layout/_interface.scss");
const layoutSource = read("scss/layout/_vscode-layout.scss");
const iconsSource = read("scss/components/_icons.scss");
const sidebarSource = read("scss/layout/_sidebar.scss");
const pluginCompatibilitySource = read("scss/vendors/_plugin-compatibility.scss");
const searchSource = read("scss/components/_search.scss");
const linksSource = read("scss/components/_links.scss");
const inputsSource = read("scss/components/_inputs.scss");
const calloutsSource = read("scss/components/_callouts.scss");
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

const themeSettingsBlock = paletteSource.match(
  /\/\* @settings\nname: "Catppuccin: Themes"[\s\S]*?\*\//,
)?.[0];
const workspaceSettingsBlock = paletteSource.match(
  /\/\* @settings\nname: "Catppuccin: Workspace"[\s\S]*?\*\//,
)?.[0];
const fontColorsBlock = paletteSource.match(
  /\/\* @settings\nname: "Catppuccin: Font Colors"[\s\S]*?\*\//,
)?.[0];
assert(paletteSource.includes('name: "Catppuccin: Themes"'), "Theme settings section must be named Themes");
assert(
  workspaceSettingsBlock?.includes("id: ctp-vscode-layout") &&
    /type: class-toggle[\s\S]*?default: true/.test(workspaceSettingsBlock),
  "Visual Studio Code layout must be a default-on Workspace toggle",
);
assert(!themeSettingsBlock?.includes("id: ctp-vscode-layout"), "Visual Studio Code layout must not live under Themes");
assert(
  workspaceSettingsBlock?.includes("title: Visual Studio Code layout") &&
    workspaceSettingsBlock?.includes("description: Use compact tabs and Visual Studio Code-style activity indicators"),
  "Visual Studio Code layout text must be explicit and describe its visible changes",
);
assert(!paletteSource.includes("Catppuccin: Catppuccin Accents"), "Duplicated Catppuccin accent label must be removed");
assert(!paletteSource.includes("catppuccin-interface-styles"), "Empty Interface Styles section must be removed");
assert(fontColorsBlock?.includes("id: ctp-page-title"), "File name settings must live under Font Colors");
assert(fontColorsBlock?.includes("id: ctp-h6"), "Heading settings must live under Font Colors");
assert(fontColorsBlock?.includes("id: ctp-bold"), "Bold color must live under Font Colors");
assert(fontColorsBlock?.includes("id: ctp-blockquote"), "Blockquote color must live under Font Colors");
const fontColorOrder = [
  "ctp-page-title",
  "ctp-h1",
  "ctp-h2",
  "ctp-h3",
  "ctp-h4",
  "ctp-h5",
  "ctp-h6",
  "ctp-bold",
  "ctp-italic",
  "ctp-strikethrough",
  "ctp-blockquote",
].map((id) => fontColorsBlock?.indexOf(`id: ${id}`) ?? -1);
assert(
  fontColorOrder.every((position, index) => position >= 0 && (index === 0 || position > fontColorOrder[index - 1])),
  "Font Colors must list file and heading colors before inline text colors",
);
assert(!paletteSource.includes("catppuccin-heading-settings"), "File name and heading settings must remain consolidated in Font Colors");
assert(!paletteSource.includes("source-code"), "Credits and Source Code section must be removed");
assert(!paletteSource.includes("PDF Settings"), "PDF settings must be removed");
assert(
  /\.view-content \.style-settings-container \.setting-item:not\(\.setting-item-heading\)[\s\S]*?flex-direction: row[\s\S]*?align-items: center/.test(settingsPageSource),
  "Style Settings controls must remain right-aligned in a single row",
);
assert(
  /\.setting-item:has\(input\[placeholder="Search Style Settings\.\.\."\]\)[\s\S]*?align-items: center/.test(settingsPageSource),
  "Style Settings Import and Export links must align with the search control",
);
assert(
  /\.setting-item:has\(input\[placeholder="Search Style Settings\.\.\."\]\)[\s\S]*?\.setting-item-name\s*\{[\s\S]*?overflow: visible/.test(settingsPageSource),
  "Style Settings search focus highlight must not be clipped by its wrapper",
);
assert(
  !/input\[placeholder="Search Style Settings\.\.\."\][\s\S]*?:focus/.test(settingsPageSource),
  "Style Settings search focus styling must remain stock-owned",
);
assert(
  /id: ctp-editor-monospace[\s\S]*?type: class-toggle[\s\S]*?default: true/.test(workspaceSettingsBlock ?? ""),
  "Editor monospace must be a default-on Workspace toggle",
);
assert(
  /\.ctp-editor-monospace \.markdown-source-view \.cm-editor[\s\S]*?font-family: var\(--font-monospace\)/.test(paletteSource),
  "Editor monospace toggle must apply the monospace font to source editing",
);

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

assert(/--ctp-tab-strip-background:\s*rgb\(var\(--ctp-crust\)\)/.test(semanticSource), "Editor tab strip must use Crust");
assert(!/\n\s*--header-height:/.test(appVariableSource), "Global view header geometry must remain stock-owned");
assert(!layoutSource.includes("--ctp-control-size"), "Root tab-bar actions must retain Obsidian's stock hit-area sizing");
assert(/\.workspace-split\.mod-root[\s\S]*?--header-height: 32px/.test(layoutSource), "Root editor tabs must retain their 32px geometry when enabled");
assert(/--ctp-tab-inactive-background:\s*rgb\(var\(--ctp-mantle\)\)/.test(semanticSource), "Inactive tabs must use Mantle");
assert(/--ctp-tab-active-background:\s*rgb\(var\(--ctp-base\)\)/.test(semanticSource), "Active tabs must use Base");
assert(/--ctp-tab-inactive-foreground:\s*rgb\(var\(--ctp-overlay0\)\)/.test(semanticSource), "Inactive tabs must use Overlay0");
assert(/\.workspace-ribbon[\s\S]*?background-color: rgb\(var\(--ctp-crust\)\)/.test(interfaceSource), "Ribbon must use Crust");
assert(/box-shadow: inset 2px 0 0 var\(--ctp-focus-border\)/.test(layoutSource), "Active ribbon controls must use an accent indicator");
assert(
  /\.workspace-tab-header-container[\s\S]*?border-bottom-color: transparent[\s\S]*?box-shadow: none/.test(layoutSource),
  "VS Code mode must remove the sidebar header seam",
);
assert(layoutSource.startsWith("/* Optional VS Code-inspired"), "Layout partial must have a clear boundary");
assert(/body\.theme-dark\.ctp-vscode-layout,\s*body\.theme-light\.ctp-vscode-layout\s*\{/.test(layoutSource), "Layout rules must use the positive body gate");
assert(!interfaceSource.includes("--ctp-control-size"), "Layout control sizing must not leak into stock mode");
assert(!interfaceSource.includes(".nav-header"), "Theme must not override Obsidian stock nav-header geometry");
assert(!interfaceSource.includes(".nav-buttons-container"), "Theme must not override Obsidian stock nav-button layout");
assert(!interfaceSource.includes(".nav-action-button"), "Theme must not override Obsidian stock nav-action sizing");
assert(!/\.clickable-icon,[\s\S]*?margin: 0 2px/.test(iconsSource), "Generic clickable icons must retain Obsidian stock margin ownership");
assert(!appVariableSource.includes("--icon-color-hover:"), "Generic icon hover color must remain stock-owned");
assert(!appVariableSource.includes("--toggle-"), "Toggle geometry and colours must remain stock-owned");
assert(
  !inputsSource.includes("--background-modifier-border-hover: var(--ctp-focus-border)"),
  "Toggle off-state colour must retain Obsidian's stock background fallback",
);
assert(!inputsSource.includes(".checkbox-container"), "Toggle appearance must remain stock-owned");
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
assert(!mainSource.includes('vendors/plugins'), "Dataview compatibility partial must not be compiled");
assert(!existsSync(join(root, "scss/vendors/_plugins.scss")), "Dataview compatibility source must be removed");
assert(!/\.dataview\.inline-field/.test(compiledCss), "Compiled theme must not contain Dataview compatibility rules");
assert(!pluginCompatibilitySource.includes("agent-client"), "Agent Client compatibility must be removed");
assert(
  /\.tree-item-self[\s\S]*?> :is\([\s\S]*?\.metadata-menu\.fileclass-icon:not\([\s\S]*?\.fileClass-add-button[\s\S]*?align-self: center;[\s\S]*?color: var\(--nav-tag-color\)/.test(pluginCompatibilitySource),
  "Metadata Menu file-tree icons must align with native file badges",
);
assert(
  /\.workspace-tab-header[\s\S]*?\.metadata-menu\.fileclass-icon:not\([\s\S]*?--icon-size: var\(--icon-s\)[\s\S]*?align-self: center[\s\S]*?color: var\(--nav-tag-color\)/.test(pluginCompatibilitySource),
  "Metadata Menu tab icons must match native badge color, icon sizing, and alignment",
);
assert(
  /body\.theme-dark\.ctp-vscode-layout,[\s\S]*?\.metadata-menu\.fileclass-icon:not\([\s\S]*?padding: 0;/.test(pluginCompatibilitySource),
  "Metadata Menu tab icons must preserve native padding in VS Code mode",
);
assert(pluginCompatibilitySource.includes("color: var(--nav-tag-color-hover)"), "Metadata Menu tree icons must follow native badge hover color");
assert(pluginCompatibilitySource.includes("color: var(--nav-tag-color-active)"), "Metadata Menu tree icons must follow native badge active color");
assert(!pluginCompatibilitySource.includes("rgb(var(--ctp-blue))"), "Metadata Menu icons must not hard-code Catppuccin Blue");
assert(!pluginCompatibilitySource.includes(".metadata-menu .chip"), "Metadata Menu must retain ownership of its stock chips");
for (const [source, target] of Object.entries({
  f87168: "flamingo",
  fbbc04: "rosewater",
  fcc934: "yellow",
  "34a853": "green",
  "4285f4": "blue",
  a142f4: "mauve",
  f442a1: "pink",
  "20c997": "teal",
  fd7e14: "flamingo",
  "6f42c1": "lavender",
})) {
  assert(
    pluginCompatibilitySource.includes(`"#${source}": ${target}`),
    `Base Board default #${source} must map to Catppuccin ${target}`,
  );
}
assert(
  /\.base-board-filter-pill,[\s\S]*?\.base-board-card-tag,[\s\S]*?\.base-board-tag-chip[\s\S]*?--tag-background: color-mix\([\s\S]*?var\(--tag-color\) 10%[\s\S]*?padding: var\(--tag-padding-y\) var\(--tag-padding-x\)[\s\S]*?border-radius: var\(--tag-radius\)[\s\S]*?color: var\(--tag-color\)[\s\S]*?text-shadow: none/.test(pluginCompatibilitySource),
  "Base Board tags must use stock Obsidian tag geometry and translucent colour treatment",
);
assert(
  /\[style\*="--tag-color: #\{\$source\}" i\][\s\S]*?--tag-color: rgb\(var\(--ctp-#\{\$target\}\)\) !important/.test(pluginCompatibilitySource),
  "Base Board generated inline colours must be remapped without replacing arbitrary picker colours",
);
assert(!pluginCompatibilitySource.includes("--tag-color: inherit"), "Base Board custom picker colours must not be reset to the global tag colour");
assert(
  /\.markdown-reading-view \.bases-embed[\s\S]*?font-size: var\(--font-ui-medium\)/.test(pluginCompatibilitySource),
  "Embedded Base views in Reading View must retain Obsidian's UI font size",
);
assert(
  /\.bases-embed[\s\S]*?\.bases-view\[data-view-type="kanban"\][\s\S]*?scrollbar-gutter: auto[\s\S]*?\.base-board-board[\s\S]*?flex: 0 0 auto[\s\S]*?justify-content: safe center[\s\S]*?\.base-board-column:not\(\.base-board-column--collapsed\)[\s\S]*?min-width: 210px[\s\S]*?max-width: 280px[\s\S]*?max-height: 400px[\s\S]*?flex: 1 1 210px/.test(pluginCompatibilitySource),
  "Embedded Base Board views must use their full width and safely centre bounded flexible columns",
);
assert(
  /\.base-board-column--collapsed[\s\S]*?min-width: 44px[\s\S]*?max-width: 44px[\s\S]*?flex: 0 0 44px[\s\S]*?\.base-board-column-placeholder[\s\S]*?min-width: 210px[\s\S]*?max-width: 280px[\s\S]*?flex: 1 1 210px[\s\S]*?\.base-board-column--collapsed\.base-board-column--drag-expanded[\s\S]*?min-width: 210px[\s\S]*?max-width: 280px[\s\S]*?flex: 1 1 210px/.test(pluginCompatibilitySource),
  "Embedded Base Board collapsed columns and drag placeholders must retain bounded sizing",
);
assert(
  /\.base-board-card-chip:is\([\s\S]*?formula\.project_scope[\s\S]*?formula\.company_link[\s\S]*?\.base-board-chip-label[\s\S]*?display: none/.test(pluginCompatibilitySource),
  "Embedded Base Board scope and company chips must hide their redundant labels",
);
assert(
  /\.base-board-add-column-btn[\s\S]*?display: none/.test(pluginCompatibilitySource),
  "Embedded Base Board views must hide the add-column control",
);
assert(
  /\.bases-embed[\s\S]*?\.base-board-cards[\s\S]*?padding-inline-end: var\(--size-4-1\)/.test(pluginCompatibilitySource),
  "Embedded Base Board cards must visually balance their start inset and scrollbar gap",
);
assert(
  /\.base-board-card[\s\S]*?display: flex[\s\S]*?flex-direction: column[\s\S]*?\.base-board-card-title[\s\S]*?order: 1[\s\S]*?\.base-board-tag-container[\s\S]*?order: 2[\s\S]*?&:empty[\s\S]*?display: none[\s\S]*?\.base-board-card-props[\s\S]*?order: 3/.test(pluginCompatibilitySource),
  "Base Board cards must present titles before non-empty tags and properties",
);
assert(
  /\.base-board-filter-bar[\s\S]*?border: var\(--code-border-width\) solid var\(--code-border-color\)[\s\S]*?border-radius: var\(--code-radius\)/.test(pluginCompatibilitySource),
  "Base Board filter bars must use the code-block border and radius treatment",
);
assert(
  /:where\([\s\S]*?\.base-board-column,[\s\S]*?\.base-board-column-header,[\s\S]*?\.base-board-card[\s\S]*?border-color: transparent/.test(pluginCompatibilitySource),
  "Base Board columns, headers, and cards must use flat borderless surfaces",
);
assert(
  /\.base-board-cards[\s\S]*?padding-block-start: 0/.test(pluginCompatibilitySource),
  "Base Board first card must sit directly beneath its flat column header",
);
assert(
  /\.base-board-column-collapse-btn[\s\S]*?color: var\(--ctp-icon-foreground\)[\s\S]*?&::before[\s\S]*?width: 10px[\s\S]*?height: 10px[\s\S]*?mask: url\("data:image\/svg\+xml,[\s\S]*?M3 8L12 17L21 8[\s\S]*?\.lucide-chevron-down, \.lucide-chevron-right[\s\S]*?display: none[\s\S]*?\.base-board-column--collapsed[\s\S]*?rotate\(-90deg\)/.test(pluginCompatibilitySource),
  "Base Board column disclosure controls must use and rotate the native file-tree glyph",
);
assert(
  /\.base-board-filter-title[\s\S]*?&::before[\s\S]*?mask: url\("data:image\/svg\+xml,[\s\S]*?M13\.172 2[\s\S]*?> \.lucide-filter[\s\S]*?display: none/.test(pluginCompatibilitySource),
  "Base Board filter title must replace the plugin funnel with Obsidian's native Tags glyph",
);
assert(!sidebarSource.includes(".nav-file-tag"), "Obsidian must retain ownership of stock file extension badges");
for (const [name, source] of Object.entries({
  "app variables": appVariableSource,
  links: linksSource,
  search: searchSource,
  settings: settingsPageSource,
})) {
  assert(!/--tag-/.test(source), `${name} must not override Obsidian's stock tag variables`);
}
assert(
  !layoutSource.includes("block-size: var(--ctp-control-size)"),
  "VS Code mode must not replace the stock root tab action sizing",
);
assert(
  /\.workspace-tab-header-container[\s\S]*?background-color: var\(--background-secondary\)/.test(interfaceSource),
  "Sidedock header controls must continue the Mantle sidebar surface",
);
assert(
  /&:not\(\.ctp-vscode-layout\)[\s\S]*?\.workspace-split\.mod-sidedock \.workspace-tab-header-container[\s\S]*?background-color: var\(--background-secondary-alt\)/.test(interfaceSource),
  "Non-VS Code sidedock header controls must use the darker Crust surface",
);
assert(
  /\.workspace-split\.mod-root \.workspace-tab-header-container[\s\S]*?padding-inline-start: 0/.test(layoutSource),
  "Root tabs must start flush with the tab strip",
);
assert(
  /\.workspace-split\.mod-root \.workspace-tab-header-container-inner[\s\S]*?margin-block: 0[\s\S]*?margin-inline-start: 0[\s\S]*?padding-block-start: 0[\s\S]*?padding-inline-start: 0/.test(layoutSource),
  "Root tab inner container must not reintroduce a leading or upper inset",
);
assert(
  /\.workspace-split\.mod-root \{[\s\S]*?\.workspace-tab-header \{[\s\S]*?padding-block: 0;[\s\S]*?:is\(\.workspace-tab-header-new-tab, \.workspace-tab-header-tab-list\) \{[\s\S]*?align-self: stretch;[\s\S]*?padding-block: 0;/.test(layoutSource),
  "Root tab labels and controls must share the tab strip's relative vertical alignment",
);
assert(
  /\.workspace-split\.mod-root \.workspace-tab-header[\s\S]*?&::before,[\s\S]*?&::after[\s\S]*?display: none/.test(layoutSource),
  "Root tabs must disable Obsidian's curved bottom-corner pseudo-elements",
);
assert(
  /&\.is-active\s*\{[\s\S]*?box-shadow: inset 0 1px 0 var\(--ctp-focus-border\);[\s\S]*?\.workspace-tab-header-inner\s*\{[\s\S]*?box-shadow: inherit;/.test(layoutSource),
  "Active root tab indicators must remain visible across the inner tab surface",
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
assert(!/input\[type="search"\]:/.test(inputsSource), "Search focus styling must remain stock-owned");
assert(
  /\.callout\s*\{[\s\S]*?--table-header-border-color:\s*var\(--table-border-color\);/.test(calloutsSource),
  "Callout table headers must inherit Obsidian's callout-aware table border role",
);
assert(!/--table-/.test(appVariableSource), "Obsidian must retain ownership of its stock table variables");
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
assert(!mainSource.includes('components/pdfs'), "PDF component partial must not be compiled");
assert(!existsSync(join(root, "scss/components/_pdfs.scss")), "PDF component source must be removed");
assert(!/\bpdf\b/i.test(`${appVariableSource}\n${iconsSource}\n${interfaceSource}`), "PDF-specific theme code must be removed");
assert(!/\bpdf\b/i.test(compiledCss), "Compiled theme must not contain PDF-specific code");

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
