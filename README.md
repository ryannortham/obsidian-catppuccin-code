<h3 align="center">
  <img src="https://raw.githubusercontent.com/catppuccin/catppuccin/main/assets/logos/exports/1544x1544_circle.png" width="100" alt="Catppuccin logo"/><br/>
  <img src="https://raw.githubusercontent.com/catppuccin/catppuccin/main/assets/misc/transparent.png" height="30" width="0" alt=""/>
  Catppuccin Code for <a href="https://obsidian.md">Obsidian</a>
  <img src="https://raw.githubusercontent.com/catppuccin/catppuccin/main/assets/misc/transparent.png" height="30" width="0" alt=""/>
</h3>

<p align="center">
  <a href="https://github.com/ryannortham/obsidian-catppuccin-code/stargazers"><img src="https://img.shields.io/github/stars/ryannortham/obsidian-catppuccin-code?colorA=363a4f&colorB=b7bdf8&style=for-the-badge" alt="GitHub stars"></a>
  <a href="https://github.com/ryannortham/obsidian-catppuccin-code/issues"><img src="https://img.shields.io/github/issues/ryannortham/obsidian-catppuccin-code?colorA=363a4f&colorB=f5a97f&style=for-the-badge" alt="Open issues"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-a6da95?style=for-the-badge&labelColor=363a4f" alt="MIT license"></a>
</p>

Catppuccin Code is a fork of
[Catppuccin for Obsidian](https://github.com/catppuccin/obsidian) for anyone who
wants Obsidian to match
[Catppuccin for Visual Studio Code](https://github.com/catppuccin/vscode).

It keeps all four flavors and uses the fonts already set in Obsidian. The
compact tab layout is optional, Obsidian's accent color is supported, and Base
Board and Metadata Menu have theme-specific styling.

<p align="center">
  <img src="assets/screenshot-hq.png" alt="Catppuccin Code in Obsidian"/>
</p>

## Flavors

<details>
<summary>🌻 Latte</summary>
<img src="assets/raw-flavor-screenshots/latte.webp" alt="Latte flavor preview"/>
</details>

<details>
<summary>🪴 Frappé</summary>
<img src="assets/raw-flavor-screenshots/frappe.webp" alt="Frappé flavor preview"/>
</details>

<details>
<summary>🌺 Macchiato</summary>
<img src="assets/raw-flavor-screenshots/macchiato.webp" alt="Macchiato flavor preview"/>
</details>

<details>
<summary>🌿 Mocha</summary>
<img src="assets/raw-flavor-screenshots/mocha.webp" alt="Mocha flavor preview"/>
</details>

## Installation

Open **Settings → Appearance → Themes → Manage**, search for **Catppuccin
Code**, then select **Install and use**.

Obsidian uses Latte in light mode and Mocha in dark mode by default.

## Recommended plugins

- **[Style Settings](https://github.com/community-archive/obsidian-style-settings)
  — theme controls.** Choose a dark flavor and accent, customize font colors,
  and toggle the workspace, editor, and plugin options.
- **[Shiki Highlighter](https://github.com/mProjectsCode/obsidian-shiki-plugin)
  — syntax highlighting.** Use `catppuccin-latte` for its light theme and your
  preferred `catppuccin-frappe`, `catppuccin-macchiato`, or
  `catppuccin-mocha` flavor for its dark theme.
- **[Base Board](https://github.com/mderazon/obsidian-base-board) — Kanban
  styling.** The theme compacts cards and columns, maps the default tag colors
  to Catppuccin, and restyles filters and icons. This integration is enabled by
  default and can be toggled under **Catppuccin: Plugins** in Style Settings.
- **[Metadata Menu](https://github.com/mdelobelle/metadatamenu) — file-class
  badges.** The theme sizes, aligns, and colors its icons like native Obsidian
  file badges, including in compact tabs.

## Development

```bash
pnpm install --frozen-lockfile
pnpm run build:theme
pnpm run lint
pnpm test
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for the source map, color roles,
compatibility boundaries, and visual regression workflow.

## Credits

Catppuccin Code began as a fork of
[Catppuccin for Obsidian](https://github.com/catppuccin/obsidian). It uses the
[Catppuccin palette](https://github.com/catppuccin/catppuccin) and follows the
interface language of
[Catppuccin for Visual Studio Code](https://github.com/catppuccin/vscode).

Released under the [MIT License](LICENSE).

<p align="center"><img src="https://raw.githubusercontent.com/catppuccin/catppuccin/main/assets/footers/gray0_ctp_on_line.svg?sanitize=true" alt="Catppuccin cat on a line"/></p>
