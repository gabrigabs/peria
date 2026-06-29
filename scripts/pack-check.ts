#!/usr/bin/env bun

/**
 * Package content validation for publishable Peria packages.
 *
 * This checks npm's actual pack list instead of relying on local source files,
 * so missing `files` entries fail before publish.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');

interface PackageJson {
  name?: string;
  private?: boolean;
}

interface PackFile {
  path: string;
}

interface PackResult {
  name: string;
  version: string;
  files: PackFile[];
}

interface PublishablePackage {
  dir: string;
  name: string;
}

const REQUIRED_FILES: Record<string, string[]> = {
  '@peria/core': ['dist/index.js', 'dist/index.d.ts'],
  '@peria/renderer': [
    'dist/index.js',
    'dist/index.d.ts',
    'dist/preview.js',
    'dist/preview.d.ts',
    'app-template/package.json',
    'app-template/source.config.ts',
    'app-template/src/routes/docs/$.tsx',
  ],
  '@peria/adapters': [
    'dist/index.js',
    'dist/express.js',
    'dist/fastify.js',
    'dist/nest.js',
    'dist/index.d.ts',
  ],
  '@peria/cli': ['bin/peria.js', 'dist/index.js', 'dist/index.d.ts'],
};

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

function getPublishablePackages(): PublishablePackage[] {
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => existsSync(join(packagesDir, entry.name, 'package.json')))
    .map((entry) => {
      const dir = join('packages', entry.name);
      const pkg = readJson<PackageJson>(join(root, dir, 'package.json'));
      return { dir, name: pkg.name ?? entry.name, private: pkg.private ?? false };
    })
    .filter((pkg) => pkg.name.startsWith('@peria/') && !pkg.private)
    .map(({ dir, name }) => ({ dir, name }))
    .sort((left, right) => left.dir.localeCompare(right.dir));
}

function npmPackDryRun(pkg: PublishablePackage): PackResult {
  const output = execFileSync('npm', ['pack', '--dry-run', '--json', '--workspace', pkg.dir], {
    cwd: root,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const parsed = JSON.parse(output) as PackResult[];
  const result = parsed[0];

  if (!result) {
    throw new Error(`npm pack --dry-run returned no result for ${pkg.name}`);
  }

  return result;
}

function validateRequiredFiles(result: PackResult): void {
  const required = REQUIRED_FILES[result.name] ?? [];
  const files = new Set(result.files.map((file) => file.path));
  const missing = required.filter((file) => !files.has(file));

  if (missing.length > 0) {
    throw new Error(
      [
        `Package ${result.name}@${result.version} is missing required packed files:`,
        ...missing.map((file) => `- ${file}`),
      ].join('\n')
    );
  }
}

const packages = getPublishablePackages();

if (packages.length === 0) {
  throw new Error('No publishable @peria/* packages found.');
}

console.log(`Validating ${packages.length} publishable packages:`);

for (const pkg of packages) {
  const result = npmPackDryRun(pkg);
  validateRequiredFiles(result);
  console.log(`- ${result.name}@${result.version}: ${result.files.length} packed files`);
}

console.log('Package content validation passed.');
