# Vendors

Vendor partials are the compatibility boundary for external plugin DOM. They
must remain isolated from core Obsidian interface ownership.

- `_plugin-compatibility.scss` contains the supported Metadata Menu and Base
  Board contracts. Base Board customisations are gated by
  `ctp-base-board-customisations`; only the Metadata Menu tab optical offset is
  gated by `ctp-vscode-layout`.

Do not move these selectors into the core interface partial or put the entire
vendor file behind the layout toggle. Core Obsidian controls must continue to
work when a plugin is absent or changes its DOM.
