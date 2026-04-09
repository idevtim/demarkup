# DeMarkup

A Chrome extension that converts any webpage into clean, well-structured Markdown and copies it to your clipboard.

**[Download latest release](https://github.com/idevtim/demarkup/releases/latest)**

## Features

- **One-click conversion** — click the icon or press `Ctrl+Shift+M` / `Cmd+Shift+M`
- **Smart content extraction** — pulls the main content, strips nav, ads, and clutter
- **Full page mode** — toggle to convert the entire page instead
- **Selection support** — right-click to convert just highlighted text
- **Download as .md** — save Markdown files named after the page
- **Word/character/token counts** — useful for LLM context budgeting
- **Copy for LLM** mode — adds page title and URL as context, strips images and noise
- **YAML front matter** — optional metadata header
- **Configurable** — bullet style, heading style, link style
- **Debug logging** — built-in log capture with export for bug reports
- **Privacy-first** — no API calls, no tracking, everything runs locally

## Install

### Chrome Web Store (recommended)

Coming soon.

### Load unpacked (development)

1. Clone this repo
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `demarkup/` folder
5. Pin the extension to your toolbar

## Usage

- **Click the icon** to open the popup, then click "Copy as Markdown" or "Download .md"
- **Keyboard shortcut**: `Ctrl+Shift+M` (Windows/Linux) or `Cmd+Shift+M` (Mac)
- **Right-click** any page for "Copy page as Markdown" or select text and right-click for "Copy selection as Markdown"

## Settings

Click the gear icon in the popup or go to the extension's options page:

- **YAML front matter** — prepend title, URL, and date
- **LLM mode** — add context header for pasting into LLMs
- **Bullet style** — `-`, `*`, or `+`
- **Heading style** — ATX (`# Heading`) or Setext (underline)
- **Link style** — inline or reference

## Bug Reports

If something doesn't convert correctly on a particular page:

1. Open the extension's **Settings** page
2. Click **Export Logs** to download a JSON log file
3. [Open a bug report](https://github.com/idevtim/demarkup/issues/new?template=bug_report.md) and attach the log file

Logs include conversion events, errors, and page metadata — no personal content is captured.

## Project Structure

```
demarkup/
├── background/
│   └── service-worker.js    # Context menus, shortcuts, message routing
├── content/
│   └── content.js           # HTML extraction, cleanup, Turndown conversion
├── popup/
│   ├── popup.html           # Extension popup UI
│   ├── popup.js             # Copy/download actions, mode toggle
│   └── popup.css
├── options/
│   ├── options.html          # Settings page
│   ├── options.js            # Settings persistence
│   └── options.css
├── lib/
│   ├── turndown.js           # Vendored Turndown.js (do not edit)
│   ├── turndown-plugin-gfm.js # Vendored GFM plugin (do not edit)
│   └── logger.js             # Debug logging with export
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── manifest.json
```

## Tech

- Manifest V3
- [Turndown.js](https://github.com/mixmark-io/turndown) for HTML-to-Markdown conversion
- [turndown-plugin-gfm](https://github.com/mixmark-io/turndown-plugin-gfm) for tables and strikethrough
- No build step — plain JS, HTML, CSS loaded directly by Chrome
- No external API calls — everything runs in-browser
- Permissions: `activeTab`, `clipboardWrite`, `storage`, `contextMenus`

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and guidelines.

## License

[MIT](LICENSE)
