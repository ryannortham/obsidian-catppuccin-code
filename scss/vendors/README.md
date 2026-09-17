# Vendors

Vendor partials are the compatibility boundary for external plugin DOM. They
must remain isolated from core Obsidian interface ownership.

- `_plugins.scss` contains small plugin-specific component adjustments.
- `_plugin-compatibility.scss` contains the supported Metadata Menu, Agent
  Client, and Base Board contracts. Shared colours remain active in both layout
  modes; only the Agent Client radius and Metadata Menu tab optical offset are
  gated by `ctp-vscode-layout`.

Do not move these selectors into the core interface partial or put the entire
vendor file behind the layout toggle. Core Obsidian controls must continue to
work when a plugin is absent or changes its DOM.
