# DeMarkup

A Chrome extension that converts any webpage into clean, well-structured Markdown and copies it to your clipboard.

## Features

- **One-click conversion** — click the icon or press `Ctrl+Shift+M` / `Cmd+Shift+M`
- **Smart content extraction** — pulls the main content, strips nav, ads, and clutter
- **Full page mode** — toggle to convert the entire page instead
- **Selection support** — right-click to convert just highlighted text
- **Download as .md** — save Markdown files named after the page
- **Word/character/token counts** — useful for LLM context budgeting
- **Copy for LLM** mode — adds page title and URL as context
- **YAML front matter** — optional metadata header
- **Configurable** — bullet style, heading style, link style
- **Privacy-first** — no API calls, no tracking, everything runs locally

## Install

1. Clone or download this repo
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

## Tech

- Manifest V3
- [Turndown.js](https://github.com/mixmark-io/turndown) for HTML→Markdown conversion
- [turndown-plugin-gfm](https://github.com/mixmark-io/turndown-plugin-gfm) for tables and strikethrough
- No external API calls — everything runs in-browser
- Permissions: `activeTab`, `clipboardWrite`, `storage`, `contextMenus`
