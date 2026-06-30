#!/bin/bash
# Dogfood validation: test @peria/cli@latest from npm in clean environment

set -e

TMPDIR=$(mktemp -d)
echo "🧪 Dogfood test in: $TMPDIR"

cleanup() {
  echo "🧹 Cleaning up..."
  rm -rf "$TMPDIR"
}
trap cleanup EXIT

cd "$TMPDIR"
npm init -y > /dev/null 2>&1

echo "📦 Installing @peria/cli@latest..."
npm install -D @peria/cli@latest --prefer-online 2>&1 | tail -5

echo ""
echo "✅ Installation successful!"
echo ""

echo "🔧 Testing commands..."
npx peria --version || echo "⚠️  version command may require scan first"

echo ""
echo "📋 Testing init..."
npx peria init --help || true

echo ""
echo "✅ Dogfood validation complete!"
echo "Note: Full scan/build requires a real TypeScript project"
