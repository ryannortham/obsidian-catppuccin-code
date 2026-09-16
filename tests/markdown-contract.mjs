import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const appVariables = read("scss/base/_app-variables.scss");
const settings = read("scss/base/_ctp-style-settings.scss");
const typography = read("scss/base/_typography.scss");
const links = read("scss/components/_links.scss");
const markdown = read("scss/components/_markdown.scss");
const palette = read("scss/themes/_full-palette.scss");
const main = read("scss/main.scss");
const compiled = read("theme.css");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function has(source, expression, message) {
  assert(expression.test(source), message);
}

const appRoles = {
  "callout-warning": "var(--color-yellow)",
  "code-normal": "var(--text-normal)",
  "code-comment": "rgb(var(--ctp-overlay2))",
  "code-function": "var(--color-blue)",
  "code-keyword": "var(--color-purple)",
  "code-property": "var(--color-blue)",
  "code-punctuation": "rgb(var(--ctp-overlay2))",
  "code-string": "var(--color-green)",
  "code-tag": "var(--color-red)",
  "code-value": "var(--color-orange)",
  "divider-color": "var(--background-secondary)",
  "hr-color": "rgb(var(--ctp-surface2))",
  "link-external-color": "rgb(var(--ctp-blue))",
  "link-external-color-hover": "rgb(var(--ctp-blue))",
  "tag-color": "rgb(var(--ctp-tag-pill-color, var(--ctp-blue)))",
  "tag-color-hover": "rgb(var(--ctp-tag-pill-color, var(--ctp-blue)))",
  "tab-divider-color": "var(--background-secondary)",
  "tab-outline-color": "var(--background-secondary)",
};

for (const [role, value] of Object.entries(appRoles)) {
  has(
    appVariables,
    new RegExp(`--${role}:\\s*${value.replace(/[()]/g, "\\$&")};`),
    `App role --${role} must resolve to ${value}`,
  );
}

const defaults = {
  bold: "text",
  italic: "text",
  strikethrough: "overlay1",
  blockquote: "subtext1",
  h1: "text",
  h2: "lavender",
  h3: "blue",
  h4: "sapphire",
  h5: "subtext1",
  h6: "subtext0",
  "tag-pill-color": "blue",
};
for (const [name, token] of Object.entries(defaults)) {
  has(
    settings,
    new RegExp(`id: ctp-${name}[\\s\\S]*?default: var\\(--ctp-${token}\\)`),
    `Style Settings default ctp-${name} must be ctp-${token}`,
  );
  const settingBlock = settings.match(
    new RegExp(`\\n    id: ctp-${name}\\s[\\s\\S]*?(?=\\n  -\\n    id:|\\n  \\*/)`),
  )?.[0];
  assert(
    settingBlock?.includes(`value: var(--ctp-${token})`),
    `Style Settings ctp-${name} must expose its default as an option`,
  );
}

has(typography, /--bold-color: rgb\(var\(--ctp-bold, var\(--ctp-text\)\)\)/, "Bold prose must default to Text");
has(typography, /--italic-color: rgb\(var\(--ctp-italic, var\(--ctp-text\)\)\)/, "Italic prose must default to Text");
has(typography, /color: rgb\(var\(--ctp-strikethrough, var\(--ctp-overlay1\)\)\)/, "Strikethrough must default to Overlay1");
has(typography, /--blockquote-color: rgb\(var\(--ctp-blockquote, var\(--ctp-subtext1\)\)\)/, "Blockquotes must default to Subtext1");
for (const [heading, token] of Object.entries({ h1: "text", h2: "lavender", h3: "blue", h4: "sapphire", h5: "subtext1", h6: "subtext0" })) {
  has(typography, new RegExp(`--${heading}-color: rgb\\(var\\(--ctp-${heading}, var\\(--ctp-${token}\\)\\)\\)`), `${heading} must default to ctp-${token}`);
}
has(typography, /background-color: rgb\(var\(--ctp-yellow\), 28%\)/, "Highlights must use translucent Yellow");
has(typography, /background-image: none;\s*color: inherit;/, "Highlighted emphasis must not reintroduce rainbow prose colors");
assert(!/var\(--ctp-teal\)/.test(typography), "Document typography must not use Teal as a hard-coded emphasis role");

has(links, /color: var\(--link-color\);/, "Markdown link formatting must follow the Blue link role");
assert(!/var\(--ctp-tag-pill-color, var\(--ctp-accent\)\)/.test(links), "Tag formatting must not fall back to the Lavender accent");

has(palette, /--hr-color: rgb\(var\(--ctp-surface2\)\)/, "Full palette must use Surface2 for rules");
has(palette, /input\[type="checkbox"\]:not\(:checked\)\s*\{[\s\S]*?border-color: rgb\(var\(--ctp-surface2\)\);[\s\S]*?background-color: transparent;[\s\S]*?box-shadow: none;/, "Unchecked tasks must use a neutral Surface2 outline");
has(palette, /&:hover,\s*&:focus-visible\s*\{[\s\S]*?border-color: rgb\(var\(--ctp-lavender\)\);[\s\S]*?background-color: rgb\(var\(--ctp-surface0\), 50%\);/, "Unchecked task hover/focus must use Surface0 and Lavender");
assert(!/background-color: rgb\(var\(--ctp-red\)\)/.test(palette), "Unchecked tasks must not use a Red fill");

assert(main.includes('@use "components/markdown";'), "Markdown component partial must be part of the build");
has(markdown, /:not\(pre\) > code/, "Inline code selector must not repaint fenced code");
has(markdown, /\.markdown-rendered pre/, "Rendered fenced-code selector is missing");
has(markdown, /HyperMD-codeblock-bg/, "Live Preview fenced-code selector is missing");
has(markdown, /--code-background: rgb\(var\(--ctp-crust\)\)/, "Fenced code must use Crust");
has(markdown, /background-color: rgb\(var\(--ctp-mantle\)\)/, "Inline code must use Mantle");
has(markdown, /\.markdown-rendered pre code\s*\{\s*background-color: transparent;/, "Nested rendered code must not cover the Crust block");

for (const fragment of [
  "--link-external-color: rgb(var(--ctp-blue))",
  "--code-keyword: var(--color-purple)",
  "--code-function: var(--color-blue)",
  "--hr-color: rgb(var(--ctp-surface2))",
  "--divider-color: var(--background-secondary)",
  "--tab-divider-color: var(--background-secondary)",
  "--tab-outline-color: var(--background-secondary)",
  "background-color: rgb(var(--ctp-crust))",
  "background-color: rgb(var(--ctp-mantle))",
  "border-color: rgb(var(--ctp-surface2))",
]) {
  assert(compiled.includes(fragment), `Generated theme is missing Markdown role: ${fragment}`);
}

assert(!/var\(--ctp-(?:teal|red)\)\);\s*\/\* document/i.test(markdown), "Markdown partial contains an angry hard-coded document role");
console.log(JSON.stringify({ result: "pass", checks: 39 }));
