#!/usr/bin/env bun

/**
 * Release script for Peria
 * Usage: bun run release.ts [patch|minor|major]
 */

import { execSync } from 'node:child_process';

const versionBump = process.argv[2] || 'patch';

console.log(`🚀 Releasing Peria v${versionBump}...`);

// Check for uncommitted changes
const status = execSync('git status --porcelain', { encoding: 'utf-8' });
if (status.trim()) {
  console.error('❌ Error: There are uncommitted changes. Please commit or stash them first.');
  process.exit(1);
}

// Check we're on main branch
const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
if (branch !== 'main') {
  console.error(`❌ Error: Must be on main branch to release. Current: ${branch}`);
  process.exit(1);
}

// Run tests first
console.log('🧪 Running tests...');
execSync('bun run test', { stdio: 'inherit' });

// Run typecheck
console.log('🔍 Running typecheck...');
execSync('bun run typecheck', { stdio: 'inherit' });

// Run build
console.log('🔨 Building packages...');
execSync('bun run build', { stdio: 'inherit' });

// Bump version
console.log(`📦 Bumping ${versionBump} version...`);
execSync(`bunx changeset version`, { stdio: 'inherit' });

// Commit version bump
console.log('📝 Committing version bump...');
execSync('git add .', { stdio: 'inherit' });
execSync('git commit -m " chore: version bump"', { stdio: 'inherit' });

// Create tag
const pkgVersion = JSON.parse(execSync('cat package.json', { encoding: 'utf-8' })).version;
console.log(` 🏷️  Creating tag v${pkgVersion}...`);
execSync(`git tag v${pkgVersion}`, { stdio: 'inherit' });

console.log(`
✅ Release prepared!

Next steps:
1. Push changes: git push && git push --tags
2. GitHub Actions will publish to npm
3. Create a GitHub release

Or run this command to publish directly:
  bunx npm-publish
`);
