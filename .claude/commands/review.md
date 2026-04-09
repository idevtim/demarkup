---
description: Review the current branch diff for issues before merging
---
## Changes to Review

!`git diff --name-only main...HEAD`

## Detailed Diff

!`git diff main...HEAD`

Review the above changes for:
1. Code quality issues
2. Security vulnerabilities (XSS, injection via content script)
3. Chrome extension API misuse
4. Missing edge cases in HTML-to-Markdown conversion
