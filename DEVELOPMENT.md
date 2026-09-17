# Catppuccin Code

This fork keeps Catppuccin's palette intact while defining flavor-relative
Obsidian interface interaction states as a coherent theme baseline.

## Baseline

- Upstream: `catppuccin/obsidian` commit
  `1316e03af5c31964116661ab08e7784bfa1d00b3`.
- Upstream manifest version: `0.4.49`; Catppuccin Code begins at `1.0.0`.
- Baseline review build: `pnpm exec sass scss/main.scss:theme.css`.
- pnpm 11 requires the locked `@parcel/watcher` build to be explicitly allowed;
  `pnpm-workspace.yaml` records that reviewed dependency.

## Source ownership

| Surface | Upstream source | Fork owner |
| --- | --- | --- |
| Palette data and Style Settings | `scss/base/_ctp-style-settings.scss` | Canonical Catppuccin names and RGB values only |
| Shared color roles | `scss/base/_semantic-roles.scss` | Single owner for Obsidian aliases, surfaces, text, accents, search, controls, and selection |
| App defaults | `scss/base/_app-variables.scss` | Geometry and component variables that consume semantic roles |
| Clickable and close icons | `scss/components/_icons.scss` | `scss/layout/_interface.scss` |
| Tree rows and navigation states | `scss/layout/_sidebar.scss` | `scss/layout/_interface.scss` |
| Backlinks context matches | `scss/components/_search.scss` | `scss/layout/_interface.scss` |
| Sidebar and editor tabs | `scss/layout/_tabs.scss` | `scss/layout/_interface.scss` |
| Metadata Menu, Agent Client, and Base Board | External plugin DOM | `scss/vendors/_plugin-compatibility.scss` compatibility boundary |

`scss/layout/_interface.scss` is intentionally loaded after the document-palette
partial. Its component-local selectors use the normal cascade and contain no
`!important` declarations. Generated CSS is never the edit target. Theme code
inherits Obsidian's font settings; no font files, `@font-face` rules, or global
font stacks are shipped.

## Flavor-relative interface roles

| Semantic role | Active palette token |
| --- | --- |
| Icon foreground | selected `--ctp-accent` |
| Focus border | selected `--ctp-accent` |
| Active/inactive list selection | `--ctp-surface0` |
| List hover | `--ctp-surface0` at 50% |
| Shared control/editor-tab hover | `--ctp-base` lightened 5% |
| Active sidebar tab at rest | transparent with selected-accent foreground |
| Sidebar tab hover, active or inactive | `--ctp-base` lightened 5% |
| Active tree guide | `--ctp-overlay2` |
| Inactive tree guide | `--ctp-surface1` |
| Empty editor tab strip and ribbon | `--ctp-crust` |
| Active editor tab | `--ctp-base` |
| Inactive editor tab | `--ctp-mantle` |
| Active editor-tab foreground | selected `--ctp-accent` |
| Inactive editor-tab foreground | `--ctp-overlay0` |
| Close-button hover | `--ctp-surface1` (distinct from editor-tab hover) |

## Markdown presentation roles

`scss/components/_markdown.scss` owns document-only surfaces so prose styling
does not leak into interface controls. Typography and link partials provide the
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
| Completed task / warning | `--ctp-green` / `--ctp-peach` |
| Inline code / fenced code | `--ctp-mantle` / `--ctp-crust` |
| Fenced-code edge | `--ctp-surface0` border |

Fenced-code syntax variables follow the Catppuccin editor guidance where
Obsidian exposes a matching role. Unclassified code remains Text; Markdown
syntax selectors are scoped to Reading View and Live Preview code surfaces.
The generated artifact is installed at
`.obsidian/themes/Catppuccin Code/theme.css` and is byte-identical to the
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
Detached Settings windows also paint their titlebar with
`var(--background-primary)`, matching the Settings Base surface in focused,
unfocused, opaque, and translucent states.
The scoped rule removes the titlebar bottom border and shadow so opaque mode
cannot reintroduce a horizontal seam.

Every interface role resolves to a token in the active Catppuccin palette.
Style Settings selects the flavor and accent classes; Mauve is the default when
no accent class is present. It does not disable the interface contract. Keep
component-state choices in semantic role variables and do not introduce
flavor-specific color literals.

Interface chrome uses one panel surface in both focus states: the focused
titlebar now shares `var(--background-secondary)` with the tabs, ribbon, and
status bar, and its border is transparent. Translucent mode only changes the
divider strokes to transparent so the surface contract does not branch by focus.
Ordinary clickable controls, status-bar actions, every sidebar-tab hover, and
inactive editor tabs consume one `--ctp-hover-background` role. It matches
Catppuccin VS Code's Base-lightened-by-5% tab hover and is painted on normalized
30px inner hit targets where Obsidian uses top-bar wrappers. Active sidebar tabs
remain transparent at rest, with the selected accent identifying the active
icon. Close and destructive states retain their separate semantic treatments.
Root editor tabs use Crust for the empty strip, Mantle for inactive tabs, Base
for the active tab, and Base lightened by 5% for inactive hover. These roles do not
change when translucency is toggled. Inactive close buttons remain in layout
while hidden, so Metadata Menu file-class icons do not shift when hover reveals
the close control.

## Compatibility boundary

Metadata Menu file-class icons, Agent Client session rows, and Base Board tags
and embedded-board layout are supported as isolated plugin contracts in
`scss/vendors/_plugin-compatibility.scss`. Their selectors must not move into
the core interface partial. If any plugin changes its DOM, core Obsidian
controls must continue to work without those selectors.

## Build and validation

```bash
pnpm install --frozen-lockfile
pnpm run build:theme
pnpm run lint
pnpm test
pnpm run test:visual
pnpm run test:visual:check
```

The contract test validates all 104 canonical palette values, 56 flavor/accent
combinations, core surface and typography roles, readable selection contrast,
and the absence of bundled fonts.
The visual command renders the same fixture under Latte, Frappé, Macchiato,
Mocha, and Mocha with the alternate Blue accent. It writes one deterministic
baseline per scenario under `tests/visual/interface-states-*.png`.

## Obsidian installation and rollback

1. Build `theme.css` and copy it with `manifest.json` and `screenshot.png` into
   `.obsidian/themes/Catppuccin Code/`.
2. Select **Catppuccin Code** and force reload Obsidian from the View menu.
3. Disable `file-browser-neutral-states` and `ui-button-states`.
4. Run the live state matrix in both sidebars and the root editor tabs.

Rollback is non-destructive: select the upstream **Catppuccin** theme and
re-enable both compatibility snippets. Do not use Cmd+R; in this vault it invokes
the random-note command rather than an application reload.
