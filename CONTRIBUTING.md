# Contributing

Catppuccin Code is an independently maintained Obsidian theme. Contributions
are welcome, especially improvements to Obsidian compatibility, Style Settings,
and the optional VS Code-inspired layout.

## Getting started

Install the locked dependencies and run the complete local check suite:

```bash
pnpm install --frozen-lockfile
pnpm run build:theme
pnpm run lint
pnpm test
pnpm run test:visual
pnpm run test:visual:check
```

The generated `theme.css` is committed because it is the installable theme
artifact. Edit the SCSS source, then regenerate it with `pnpm run build:theme`.

## Project structure

- `scss/base/` contains Obsidian variable defaults, the Catppuccin palette, and
  shared semantic roles.
- `scss/components/` contains document, editor, input, link, and command-palette
  styling.
- `scss/layout/` contains interface colors and the optional VS Code-inspired
  geometry.
- `scss/pages/` contains page-specific styling such as Canvas and Settings.
- `scss/themes/` contains flavor and document-palette rules.
- `scss/vendors/` contains isolated compatibility rules for supported plugins
  and task-status checklists.
- `tests/` contains source contracts and deterministic visual fixtures.

Use semantic roles from `scss/base/_semantic-roles.scss` for shared colors.
Keep layout geometry in `_vscode-layout.scss` behind the
`ctp-vscode-layout` class so native Obsidian layout remains a supported mode.
Plugin selectors belong in `scss/vendors/` and should not become core interface
rules.

## Local installation

To test a build in Obsidian, copy `theme.css`, `manifest.json`, and
`screenshot.png` into:

```text
.obsidian/themes/Catppuccin Code/
```

Select **Catppuccin Code** in **Settings → Appearance**, then reload the
workspace from Obsidian's View menu if necessary.

## Pull requests

Explain the user-visible behavior being changed, include screenshots for visual
changes, and report the checks you ran. Do not edit generated CSS by hand or
add bundled fonts; the theme inherits Obsidian's configured fonts.
