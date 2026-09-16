# Catppuccin Workbench

This fork keeps Catppuccin's palette intact while defining flavor-relative
Obsidian workbench interaction states as a coherent theme baseline.

## Baseline

- Upstream: `catppuccin/obsidian` commit
  `1316e03af5c31964116661ab08e7784bfa1d00b3`.
- Upstream and installed Obsidian manifest version: `0.4.49`.
- Baseline review build: `pnpm exec sass scss/main.scss:theme.css`.
- Current build SHA-256: `995612864888ca0340321d0e63ee4e4fd9b255b397fa02ed9b7301fdaa0d7abe`.
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
