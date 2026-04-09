Package the DeMarkup Chrome extension into a distributable ZIP file.

## Steps

1. Read `manifest.json` to get the current version number.
2. Verify all required files exist: `manifest.json`, `background/`, `content/`, `popup/`, `options/`, `lib/`, `icons/`.
3. Create a ZIP file named `demarkup-v{version}.zip` in the project root containing only the extension files:
   - `manifest.json`
   - `background/`
   - `content/`
   - `popup/`
   - `options/`
   - `lib/`
   - `icons/`
4. Exclude all non-extension files: `.claude/`, `.git/`, `.gitignore`, `CLAUDE.md`, `README.md`, `*.zip`, `*.crx`, `*.pem`, `.DS_Store`, and any other dotfiles or development artifacts.
5. List the contents of the ZIP to confirm it looks correct.
6. Report the final file name, size, and version number.
