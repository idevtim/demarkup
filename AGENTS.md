# DeMarkup — Chrome Extension

A Chrome extension (Manifest V3) that converts webpages to clean Markdown using Turndown.js.

## Architecture

- `background/service-worker.js` — context menus, keyboard shortcuts, message routing, injects content script
- `content/content.js` — HTML extraction, cleanup, Turndown conversion, front matter, stats
- `popup/popup.js` — UI controller for copy/download, mode toggles, stats display
- `options/options.js` — settings persistence via Chrome storage sync API
- `lib/turndown.js` + `lib/turndown-plugin-gfm.js` — vendored libraries (do not edit)
- `lib/logger.js` — debug logging stored in `chrome.storage.local`, exportable from options page

## Conventions

- No build step — plain JS, HTML, CSS loaded directly by Chrome
- All conversion logic lives in `content/content.js`; keep it self-contained
- User preferences stored via `chrome.storage.sync`
- No external API calls — everything runs locally in the browser
- Permissions are minimal: `activeTab`, `clipboardWrite`, `storage`, `contextMenus`

## Key Decisions

- Turndown.js is vendored in `lib/`, not loaded from a CDN
- Content script is injected dynamically by the service worker, not declared in manifest
- Three conversion modes: main content extraction, full page, and selection
- Token count is estimated (chars / 4), not from a real tokenizer

## Testing

- Load unpacked in `chrome://extensions/` with Developer mode enabled
- Test on diverse pages: articles, tables, code blocks, pages with heavy nav/ads
- Verify context menu, keyboard shortcut (Cmd+Shift+M), and popup all work
