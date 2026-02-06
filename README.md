<a href="https://roamjs.com/">
    <img src="https://avatars.githubusercontent.com/u/138642184" alt="RoamJS Logo" title="RoamJS" align="right" height="60" />
</a>

# Stats

Your graph, by the numbers—pages, content, links, and block types in one instant dashboard.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/RoamJS/stats)

![](https://github.com/user-attachments/assets/d3c73c15-5e91-4be3-aa49-471b838681e8)

## Features

- **Overview** — Pages, interconnections (block refs), Firebase links, external links
- **Content breakdown** — Text blocks (count, words, characters), block quotes, code blocks
- **Block types** — Counts for TODO, DONE, query, embed, table, kanban, video, roam/js (click a tag to open that page)
- **Account** — Current user display name and email

Open the drawer via the command palette: **Stats: Toggle Stats Drawer**.

## Installation

Install from [Roam Depot](https://roamdepot.com) or load the extension in development (see below).

## Development

- `npm start` — run in development mode (`samepage dev`)
- `npm run build:roam` — build for Roam (dry run; CI runs full publish)

## Tech

- **roamjs-components** — UI (Drawer, Card, etc.) and utilities
- **Datalog** — stats are computed with `roamAlphaAPI.data.async.q` (pages, blocks, refs, links)

## License

MIT
