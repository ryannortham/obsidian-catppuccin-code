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
[Catppuccin for Obsidian](https://github.com/catppuccin/obsidian), restyled to
match [Catppuccin for VS Code](https://github.com/catppuccin/vscode).

It includes all four Catppuccin flavors, configurable accents, and Style
Settings support.

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

### Community themes

Once published, install **Catppuccin Code** from **Settings → Appearance →
Themes → Manage** in Obsidian.

### Manual installation

1. Download `manifest.json` and `theme.css` from the latest release.
2. Create `.obsidian/themes/Catppuccin Code/` inside your vault.
3. Copy both files into that directory.
4. Reload Obsidian and select **Catppuccin Code** under **Appearance → Themes**.

Obsidian uses Latte in light mode and Mocha in dark mode by default. Install the
[Style Settings plugin](https://github.com/mgmeyers/obsidian-style-settings) to
select Frappé or Macchiato and customize the accent and interface options.

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

Catppuccin Code builds on the original
[Catppuccin for Obsidian](https://github.com/catppuccin/obsidian) theme and the
[Catppuccin palette](https://github.com/catppuccin/catppuccin). Its interface
color hierarchy follows [Catppuccin for VS Code](https://github.com/catppuccin/vscode).

Released under the [MIT License](LICENSE).

<p align="center"><img src="https://raw.githubusercontent.com/catppuccin/catppuccin/main/assets/footers/gray0_ctp_on_line.svg?sanitize=true" alt="Catppuccin cat on a line"/></p>
