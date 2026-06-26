#!/usr/bin/env node

/**
 * Version bump script for the Peria monorepo.
 *
 * Usage:
 *   bun scripts/version.ts <patch|minor|major> [--dry-run]
 *
 * Bumps all packages to the same version based on the root package.json,
 * updates internal @peria/* dependency references, and creates a git tag.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

const PACKAGES = [
  'packages/core',
  'packages/adapters',
  'packages/api-reference',
  'packages/renderer',
  'packages/sdk',
  'packages/cli',
];

type BumpType = 'patch' | 'minor' | 'major';

function bumpVersion(current: string, type: BumpType): string {
  const [major, minor, patch] = current.split('.').map(Number);
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
  }
}

function readJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJson(path: string, data: unknown) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

// --- Main ---

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const type = args.find((a) => ['patch', 'minor', 'major'].includes(a)) as BumpType | undefined;

if (!type) {
  console.error('Usage: bun scripts/version.ts <patch|minor|major> [--dry-run]');
  process.exit(1);
}

// Read current version from root
const rootPkg = readJson(join(ROOT, 'package.json'));
const currentVersion = rootPkg.version;
const newVersion = bumpVersion(currentVersion, type);

console.log(`\n📦 Version bump: ${currentVersion} → ${newVersion} (${type})\n`);

// Update root package.json
rootPkg.version = newVersion;
if (!dryRun) writeJson(join(ROOT, 'package.json'), rootPkg);
console.log(`  ✅ package.json → ${newVersion}`);

// Update each package
for (const pkgDir of PACKAGES) {
  const pkgPath = join(ROOT, pkgDir, 'package.json');
  const pkg = readJson(pkgPath);
  const oldVersion = pkg.version;

  pkg.version = newVersion;

  // Update @peria/* dependencies to new version
  for (const depField of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
    const deps = pkg[depField];
    if (!deps) continue;
    for (const [name, value] of Object.entries(deps)) {
      if (
        name.startsWith('@peria/') &&
        typeof value === 'string' &&
        !value.startsWith('workspace:')
      ) {
        deps[name] = newVersion;
      }
    }
  }

  if (!dryRun) writeJson(pkgPath, pkg);
  console.log(`  ✅ ${pkg.name}: ${oldVersion} → ${newVersion}`);
}

if (dryRun) {
  console.log('\n🔍 Dry run — no files were modified.\n');
  process.exit(0);
}

// Git commit and tag
console.log('\n📝 Creating git commit and tag...\n');

try {
  execSync('git add -A', { cwd: ROOT, stdio: 'inherit' });
  execSync(`git commit -m "chore: release v${newVersion}"`, { cwd: ROOT, stdio: 'inherit' });
  execSync(`git tag v${newVersion}`, { cwd: ROOT, stdio: 'inherit' });

  // Export version for GitHub Actions
  const githubEnv = process.env.GITHUB_ENV;
  if (githubEnv) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(githubEnv, `NEW_VERSION=${newVersion}\n`);
    console.log(`\n📤 Exported NEW_VERSION=${newVersion} to GITHUB_ENV`);
  }

  console.log(`\n🎉 Done! Release v${newVersion} is ready.\n`);
  console.log('To publish, push the tag:');
  console.log(`  git push origin main --tags\n`);
} catch {
  console.error('\n⚠️  Git commit/tag failed. You may need to commit manually.');
  process.exit(1);
}
