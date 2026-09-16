# Catppuccin Workbench

This fork keeps Catppuccin's palette intact while defining flavor-relative
Obsidian workbench interaction states as a coherent theme baseline.

## Baseline

- Upstream: `catppuccin/obsidian` commit
  `1316e03af5c31964116661ab08e7784bfa1d00b3`.
- Upstream and installed Obsidian manifest version: `0.4.49`.
- Baseline review build: `pnpm exec sass scss/main.scss:theme.css`.
- Current build SHA-256: `d604a38523872bbd9ab9073c657344058d624dccd362516e2051914d5cb70720`.
- pnpm 11 requires the locked `@parcel/watcher` build to be explicitly allowed;
  `pnpm-workspace.yaml` records that reviewed dependency.

## Source ownership

| Surface | Upstream source | Fork owner |
| --- | --- | --- |
| Palette and app variables | `scss/base/_ctp-style-settings.scss`, `scss/base/_app-variables.scss` | Palette remains unchanged; semantic roles live in `scss/layout/_workbench.scss` |
| Clickable and close icons | `scss/components/_icons.scss`, `scss/themes/_full-palette.scss` | `scss/layout/_workbench.scss` |
| Tree rows and navigation states | `scss/layout/_sidebar.scss`, `scss/themes/_full-palette.scss` | `scss/layout/_workbench.scss` |
| Backlinks context matches | `scss/components/_search.scss` | `scss/layout/_workbench.scss` |
| Sidebar and editor tabs | `scss/layout/_tabs.scss`, `scss/themes/_full-palette.scss` | `scss/layout/_workbench.scss` |
| Metadata Menu and Agent Client | External plugin DOM | `scss/vendors/_workbench-compatibility.scss` compatibility boundary |

`scss/layout/_workbench.scss` is intentionally loaded after the full-palette
partial. Its component-local selectors use the normal cascade and contain no
`!important` declarations. Generated CSS is never the edit target.

## Flavor-relative workbench roles

| Semantic role | Active palette token |
| --- | --- |
| Icon foreground | `--ctp-mauve` |
| Focus border | `--ctp-mauve` |
| Active/inactive selection | `--ctp-surface0` |
| List hover | `--ctp-surface0` at 50% |
| Active tree guide | `--ctp-overlay2` |
| Inactive tree guide | `--ctp-surface1` |
| Active editor tab | `--ctp-base` |
| Inactive editor tab | `--ctp-mantle` |
| Editor-tab hover | `--ctp-surface0` |
| Active editor-tab foreground | `--ctp-mauve` |
| Close-button hover | `--ctp-surface1` (distinct from editor-tab hover) |

## Markdown presentation roles

`scss/components/_markdown.scss` owns document-only surfaces so prose styling
does not leak into workbench controls. Typography and link partials provide the
semantic fallbacks; Style Settings variables remain the user override boundary.

| Document role | Default token |
| --- | --- |
| Body, bold, italic, bold-italic, H1 | `--ctp-text` |
| H2 / H3 / H4 | `--ctp-lavender` / `--ctp-blue` / `--ctp-sapphire` |
| H5 / H6 | `--ctp-subtext1` / `--ctp-subtext0` |
| Links, bare URLs, tags | `--ctp-blue` |
| Blockquote text / border | `--ctp-subtext1` / `--ctp-lavender` |
| Strikethrough / highlight | `--ctp-overlay1` / 28% `--ctp-yellow` |
| Horizontal rule | `--ctp-surface2` |
| Unchecked task | transparent + `--ctp-surface2` border |
| Unchecked hover/focus | 50% `--ctp-surface0` + `--ctp-lavender` border |
| Completed task / warning | `--ctp-green` / `--ctp-yellow` |
| Inline code / fenced code | `--ctp-mantle` / `--ctp-crust` |
| Fenced-code edge | `--ctp-surface0` border |

Fenced-code syntax variables follow the Catppuccin editor guidance where
Obsidian exposes a matching role. Unclassified code remains Text; Markdown
syntax selectors are scoped to Reading View and Live Preview code surfaces.
The generated artifact is installed at
`.obsidian/themes/Catppuccin Workbench/theme.css` and is byte-identical to the
reviewed build. Every `variable-select` default is also present in its options
list, so Style Settings can render and restore the default rather than showing a
blank selector.

Pane and tab seams match the standard panel surface: `--divider-color`,
`--tab-divider-color`, and `--tab-outline-color` resolve to
`var(--background-secondary)`, so the divider geometry remains available without
introducing a contrasting rule.
The ribbon edge uses `var(--background-secondary)` to blend into the standard
panel surface. Vertical split handles retain Obsidian’s transparent native paint
so they do not cover adjacent scrollbars; resize hover remains accented.
When Obsidian’s translucent window mode is active, divider and tab-outline
variables (including the ribbon edge) switch to transparent so they do not draw
strokes over the backdrop.
The Settings two-column navigation edge is explicitly transparent in both modes,
so the Settings pane does not inherit the darker global divider stroke.

Every workbench role resolves to a token in the active Catppuccin palette.
Style Settings selects the flavor and accent classes; it does not disable the
Workbench contract. Keep component-state choices in semantic role variables and
do not introduce flavor-specific color literals.

## Compatibility boundary

Metadata Menu file-class icons and Agent Client session rows are supported as
isolated plugin contracts in `scss/vendors/_workbench-compatibility.scss`. Their selectors must
not move into the core workbench partial. If either plugin changes its DOM, core
Obsidian controls must continue to work without those selectors.

## Build and validation

```bash
pnpm install --frozen-lockfile
pnpm run build:theme
pnpm run lint
pnpm test
pnpm run test:visual
pnpm run test:visual:check
```

The contract test validates the theme's declared workbench roles against Latte,
Frappé, Macchiato, and Mocha palette blocks directly, including the
Style-Settings-enabled body classes.
The visual command renders the same fixture under Latte, Frappé, Macchiato,
Mocha, and Mocha with the alternate Blue accent. It writes one deterministic
baseline per scenario under `tests/visual/workbench-states-*.png`.

## Obsidian installation and rollback

1. Build `theme.css` and copy it with `manifest.json` and `screenshot.png` into
   `.obsidian/themes/Catppuccin Workbench/`.
2. Select **Catppuccin Workbench** and force reload Obsidian from the View menu.
3. Disable `file-browser-neutral-states` and `ui-button-states`.
4. Run the live state matrix in both sidebars and the root editor tabs.

Rollback is non-destructive: select the upstream **Catppuccin** theme and
re-enable both compatibility snippets. Do not use Cmd+R; in this vault it invokes
the random-note command rather than an application reload.
