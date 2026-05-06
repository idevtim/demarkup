#!/bin/bash
set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# ─── Pre-flight: gh CLI authenticated ───────────────────────────────────────
if ! gh auth status >/dev/null 2>&1; then
  echo "❌ gh CLI is not authenticated. Run: gh auth login"
  exit 1
fi

# ─── Read version from manifest.json ────────────────────────────────────────
VERSION=$(grep '"version"' "$PROJECT_DIR/manifest.json" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
if [ -z "$VERSION" ]; then
  echo "❌ Could not read version from manifest.json"
  exit 1
fi
echo "📦 Releasing DeMarkup v$VERSION"

# ─── Pre-flight: release notes check ────────────────────────────────────────
RELEASE_NOTES="$PROJECT_DIR/release-notes/v$VERSION.md"
if [ ! -f "$RELEASE_NOTES" ]; then
  echo "❌ Missing release notes: release-notes/v$VERSION.md"
  echo "   Create this file before releasing."
  exit 1
fi
echo "✓ Found release notes for v$VERSION"

# ─── Pre-flight: clean working tree ─────────────────────────────────────────
if [ -n "$(git -C "$PROJECT_DIR" status --porcelain)" ]; then
  echo "❌ Working tree is not clean. Commit or stash changes first."
  exit 1
fi
echo "✓ Working tree is clean"

# ─── Pre-flight: check tag doesn't already exist on remote ──────────────────
if git -C "$PROJECT_DIR" ls-remote --tags origin "v$VERSION" | grep -q "v$VERSION"; then
  echo "❌ Tag v$VERSION already exists on remote. Bump the version in manifest.json."
  exit 1
fi
echo "✓ Tag v$VERSION is available"

# ─── Package ZIP ─────────────────────────────────────────────────────────────
ZIP_NAME="demarkup-v$VERSION.zip"
ZIP_PATH="$PROJECT_DIR/$ZIP_NAME"
rm -f "$ZIP_PATH"

echo "📦 Creating $ZIP_NAME..."
cd "$PROJECT_DIR"
zip -r "$ZIP_PATH" \
  manifest.json \
  background/ \
  content/ \
  popup/ \
  options/ \
  lib/ \
  icons/ \
  -x "*.DS_Store" 2>&1

ZIP_SIZE=$(du -h "$ZIP_PATH" | cut -f1 | xargs)
echo "   ✓ Created: $ZIP_NAME ($ZIP_SIZE)"

# ─── Verify ZIP contents ────────────────────────────────────────────────────
echo "🔍 Verifying ZIP contents..."
unzip -t "$ZIP_PATH" > /dev/null 2>&1
echo "   ✓ ZIP is valid"

# ─── Git tag ─────────────────────────────────────────────────────────────────
echo "🏷  Creating git tag v$VERSION..."
git -C "$PROJECT_DIR" tag "v$VERSION"
git -C "$PROJECT_DIR" push origin "v$VERSION" 2>&1
echo "   ✓ Tag v$VERSION pushed"

# ─── GitHub Release ─────────────────────────────────────────────────────────
echo "🚀 Creating GitHub release v$VERSION..."
gh release create "v$VERSION" "$ZIP_PATH" \
  --title "v$VERSION" \
  --notes-file "$RELEASE_NOTES"

# ─── Cleanup ─────────────────────────────────────────────────────────────────
rm -f "$ZIP_PATH"
echo ""
echo "✅ Released DeMarkup v$VERSION on GitHub"
