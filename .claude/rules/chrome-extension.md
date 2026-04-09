---
paths:
  - "**/*.js"
  - "**/*.html"
---
# Chrome Extension Rules

- Use Manifest V3 APIs only — no Manifest V2 patterns (e.g., `chrome.browserAction` is `chrome.action`)
- Content scripts run in the page context — never assume access to extension APIs without message passing
- Service worker is ephemeral — no persistent state, use `chrome.storage` instead
- Keep permissions minimal — do not add new permissions without justification
- Vendored libs in `lib/` must not be modified directly
