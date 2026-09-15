# Catppuccin Workbench

This fork keeps Catppuccin's palette intact while aligning Obsidian's Mocha
workbench interaction states with Catppuccin for VS Code 3.19.0.

## Baseline

- Upstream: `catppuccin/obsidian` commit
  `1316e03af5c31964116661ab08e7784bfa1d00b3`.
- Upstream and installed Obsidian manifest version: `0.4.49`.
- Baseline review build: `pnpm exec sass scss/main.scss:theme.css`.
- Baseline SHA-256: `f1cab3be0129f6e9850d12d89462fa034f7a1437c48a6b3817dc96c95cbca422`.
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

## Mocha workbench roles

| Semantic role | VS Code token | Mocha value |
| --- | --- | --- |
| Icon foreground | `icon.foreground` | `#cba6f7` |
| Focus border | `focusBorder` | `#cba6f7` |
| Active/inactive selection | `list.activeSelectionBackground`, `list.inactiveSelectionBackground` | `#313244` |
| List hover | `list.hoverBackground` | `#31324480` |
| Active tree guide | `tree.indentGuidesStroke` | `#9399b2` |
| Inactive tree guide | `tree.inactiveIndentGuidesStroke` | `#45475a` |
| Active editor tab | `tab.activeBackground` | `#1e1e2e` |
| Inactive editor tab | `tab.inactiveBackground` | `#181825` |
| Editor-tab hover | `tab.hoverBackground` | `#28283d` |
| Active editor-tab foreground | `tab.activeForeground` | `#cba6f7` |
| Close-button hover | Workbench toolbar behavior | `#313244` |

`#28283d` is an exact component value from the VS Code theme. It is not a
Catppuccin palette color and must remain a component token.

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

The contract test reads the installed Catppuccin for VS Code Mocha 3.19.0 theme
by default. Override it with `CATPPUCCIN_VSC_MOCHA=/absolute/path/mocha.json`.
The visual command renders `tests/fixtures/workbench-states.html` with the local
Chrome installation and writes `tests/visual/workbench-states.png`.

## Obsidian installation and rollback

1. Build `theme.css` and copy it with `manifest.json` into
   `.obsidian/themes/Catppuccin Workbench/`.
2. Select **Catppuccin Workbench** and force reload Obsidian from the View menu.
3. Disable `file-browser-neutral-states` and `ui-button-states`.
4. Run the live state matrix in both sidebars and the root editor tabs.

Rollback is non-destructive: select the upstream **Catppuccin** theme and
re-enable both compatibility snippets. Do not use Cmd+R; in this vault it invokes
the random-note command rather than an application reload.
