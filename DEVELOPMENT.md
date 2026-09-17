# Catppuccin Code development

Catppuccin Code keeps Catppuccin's palette intact while defining
flavor-relative Obsidian interface states. Color roles are always active; the
optional VS Code-inspired layout is controlled independently through Style
Settings.

## Build and validation

```bash
pnpm install --frozen-lockfile
pnpm run build:theme
pnpm run lint
pnpm test
pnpm run test:visual
pnpm run test:visual:check
pnpm run test:visual:markdown
pnpm run test:visual:markdown:check
```

The contract tests cover the canonical palette, flavor and accent combinations,
surface and typography roles, readable selection contrast, plugin boundaries,
and the absence of bundled fonts. The visual commands render deterministic
fixtures for all four flavors and the alternate Blue accent.

`theme.css` is generated from `scss/main.scss` and is the installable artifact.
Do not edit it directly.

## Source ownership

| Area | Responsibility |
| --- | --- |
| `scss/base/_ctp-style-settings.scss` | Catppuccin palette values and Style Settings metadata |
| `scss/base/_semantic-roles.scss` | Shared Obsidian aliases, surfaces, text, accents, controls, and selection roles |
| `scss/base/_app-variables.scss` | Obsidian-compatible variable defaults and intentional document/font roles |
| `scss/components/` | Document, editor, input, link, search, and command-palette styling |
| `scss/layout/_interface.scss` | Shared interface color adapters and native-compatible tab/sidebar states |
| `scss/layout/_vscode-layout.scss` | Optional compact tabs, indicators, flat corners, and close-slot geometry |
| `scss/pages/` | Canvas and Settings page styling |
| `scss/themes/` | Flavor adjustments and document-palette roles |
| `scss/vendors/` | Isolated contracts for supported external plugin DOM |

The interface partial is loaded after the document palette, followed by the
optional layout partial and vendor compatibility rules. Generated CSS is never
the edit target. The theme inherits Obsidian's font settings; no font files,
`@font-face` rules, or global font stacks are shipped.

## Layout mode

The `ctp-vscode-layout` Style Settings class-toggle defaults on so users get the
compact tabs and indicators by default. Turning it off removes the class and
restores Obsidian's native interface geometry while keeping the selected flavor,
accent, document palette, and font settings active. If Style Settings is not
available, the class is absent and native layout is the intentional fallback.

The `ctp-base-board-customisations` Plugins class-toggle defaults on and gates
the Base Board compatibility rules independently from Metadata Menu styling.
Turning it off restores the plugin's native board layout, controls, icons, and
tag treatment without affecting Base Board functionality.

## Color and state roles

Use semantic variables instead of flavor-specific color literals. The active
accent is used for icon foregrounds, focus borders, indicators, and other
foreground emphasis. Neutral Catppuccin surfaces are used for selections and
hover states so text remains readable across all flavors.

Document-only surfaces belong in `scss/components/_markdown.scss`; they must
not leak into interface controls. Plugin DOM contracts belong in
`scss/vendors/_plugin-compatibility.scss` or the appropriate vendor partial so
core Obsidian controls remain usable when a plugin is absent or changes its DOM.

## Testing a build in Obsidian

Copy `theme.css`, `manifest.json`, and `screenshot.png` into
`.obsidian/themes/Catppuccin Code/`, select **Catppuccin Code**, and exercise
the Settings, sidebar, and root editor tabs with the VS Code-inspired layout on
and off. Check both focused and unfocused windows, translucent windows, and any
supported plugin views affected by the change.
