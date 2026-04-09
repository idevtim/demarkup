# Contributing to DeMarkup

Thanks for your interest in contributing. Here's how to get set up.

## Setup

1. Fork and clone the repo
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode**
4. Click **Load unpacked** and select the cloned `demarkup/` folder
5. Make changes — the extension reloads when you click the refresh icon on the extensions page

No build step, no dependencies to install.

## Making Changes

1. Create a branch from `main`
2. Make your changes
3. Test on a few different page types (articles, docs, code-heavy pages, pages with heavy nav/ads)
4. Verify context menu, keyboard shortcut (`Cmd+Shift+M`), and popup all work
5. Open a PR

## Project Overview

| Directory | Purpose |
|-----------|---------|
| `background/` | Service worker — context menus, keyboard shortcuts, message routing, script injection |
| `content/` | Content script — HTML extraction, cleanup, Turndown conversion, front matter |
| `popup/` | Popup UI — copy/download buttons, mode toggle, stats display |
| `options/` | Settings page — preferences stored via `chrome.storage.sync` |
| `lib/` | Vendored libraries (Turndown.js, GFM plugin) and shared utilities (logger) |

## Guidelines

- **Keep PRs focused** — one feature or fix per PR
- **Plain vanilla JS** — no TypeScript, no frameworks, no build tools
- **Use `const`/`let`** — never `var`
- **Prefer `async/await`** over `.then()` chains
- **Do not edit vendored files** in `lib/turndown.js` or `lib/turndown-plugin-gfm.js`
- **Keep permissions minimal** — don't add new Chrome permissions without justification
- **Test diverse pages** — articles, tables, code blocks, pages with heavy nav/ads

## Architecture Notes

- Content script is injected dynamically by the service worker, not declared in the manifest
- The service worker is ephemeral (Manifest V3) — no persistent state, use `chrome.storage`
- Three conversion modes: main content extraction, full page, and selection
- Token count is estimated (`chars / 4`), not from a real tokenizer
- All conversion logic lives in `content/content.js` — keep it self-contained

## Questions?

Open an issue — happy to help.
