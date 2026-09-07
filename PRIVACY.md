# Privacy Policy for DeMarkup

**Last updated:** September 7, 2026

DeMarkup is a Chrome extension that converts webpages into Markdown. This policy
explains what the extension does and does not do with your data.

## Summary

**DeMarkup does not collect, transmit, store, or sell any personal data.**

All conversion happens locally in your browser. The extension makes no network
requests of any kind.

## What DeMarkup accesses

### Page content

When you explicitly invoke DeMarkup — by clicking the toolbar icon, using the
right-click menu, or pressing the keyboard shortcut — the extension reads the
HTML of the page you are currently viewing in order to convert it to Markdown.

This content is processed entirely in your browser's memory. It is written only
to the destination you choose: your clipboard, or a `.md` file you download. It
is never sent to any server, including ours. We have no servers.

DeMarkup does not read pages in the background, and has no access to any page
until you invoke it on that page.

### Preferences

Your settings — conversion mode, bullet and heading style, front matter
preferences — are stored using Chrome's `storage.sync` API. If you are signed
into Chrome, these settings sync across your devices through your Google
account, exactly as your bookmarks do. They contain only your preferences, never
page content. This data is handled by Google under their privacy policy; the
developer of DeMarkup cannot access it.

### Debug logs

DeMarkup includes an optional debug logging feature, disabled by default. When
enabled, diagnostic messages are written to `chrome.storage.local`, which stays
on your device. These logs are never transmitted anywhere. You can view, export,
and clear them from the extension's options page.

If you choose to export a debug log and attach it to a bug report, please review
its contents first — it may include page titles or URLs from your browsing.
Sharing it is entirely your decision.

## What DeMarkup does not do

- No analytics, telemetry, or usage tracking
- No advertising or advertising identifiers
- No external API calls or remote code execution
- No cookies
- No collection of personally identifiable information
- No sale or transfer of data to third parties

The Markdown conversion library (Turndown) and the fonts used in the interface
are bundled inside the extension package rather than loaded from a CDN, so no
third party — Google Fonts included — is contacted when you use DeMarkup.

## Permissions

| Permission | Why it is needed |
|---|---|
| `activeTab` | Read the current page's content when you invoke the extension, and only then |
| `scripting` | Inject the conversion script into the page you invoked the extension on |
| `clipboardWrite` | Copy the resulting Markdown to your clipboard |
| `storage` | Save your preferences and, if enabled, local debug logs |
| `contextMenus` | Add the right-click menu entries for converting a page or selection |

DeMarkup requests no host permissions, so it has no standing access to any
website.

## Children's privacy

DeMarkup does not knowingly collect information from anyone, including children
under 13.

## Changes to this policy

Any changes will be published in this file, with the "Last updated" date
revised. Material changes will also be noted in the release notes.

## Contact

Questions about this policy, or about DeMarkup's handling of data:

- Open an issue: https://github.com/idevtim/demarkup/issues
- Source code: https://github.com/idevtim/demarkup

DeMarkup is open source under the MIT License. You are welcome to verify every
claim in this policy by reading the source.
