/**
 * Packages Collector - Collects package information
 */

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, sep } from 'node:path';
import type { PackageSummary } from '../../types/wiki.js';

interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  private?: boolean;
  publishConfig?: {
    access?: string;
  };
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  exports?: string[] | Record<string, unknown>;
  bin?: string | Record<string, string>;
}

function normalizePath(path: string): string {
  if (!path || path === '.') return '.';
  return path.split(sep).join('/');
}

function getExportKeys(exportsField: PackageJson['exports']): string[] {
  if (!exportsField) return [];
  if (Array.isArray(exportsField)) return exportsField;
  return Object.keys(exportsField).sort();
}

function getBinKeys(binField: PackageJson['bin']): string[] {
  if (!binField) return [];
  if (typeof binField === 'string') return ['default'];
  return Object.keys(binField).sort();
}

async function readJsonFile<T>(path: string): Promise<T | null> {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function collectPackages(cwd: string): Promise<PackageSummary[]> {
  const packageFiles = ['package.json'];
  const packagesDir = join(cwd, 'packages');

  try {
    const packageDirs = await readdir(packagesDir, { withFileTypes: true });
    for (const entry of packageDirs) {
      if (entry.isDirectory()) {
        packageFiles.push(`packages/${entry.name}/package.json`);
      }
    }
  } catch {
    // A single-package project is still valid.
  }

  const summaries: PackageSummary[] = [];

  for (const manifestPath of packageFiles) {
    const absolutePath = join(cwd, manifestPath);
    const pkg = await readJsonFile<PackageJson>(absolutePath);
    if (!pkg?.name) continue;

    const dependencies = Array.from(
      new Set([
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.devDependencies ?? {}),
        ...Object.keys(pkg.peerDependencies ?? {}),
      ])
    ).sort();

    summaries.push({
      name: pkg.name,
      version: pkg.version,
      directory: normalizePath(dirname(manifestPath)),
      manifestPath,
      description: pkg.description,
      private: pkg.private ?? false,
      publishAccess: pkg.publishConfig?.access,
      scripts: pkg.scripts ?? {},
      dependencies,
      exports: getExportKeys(pkg.exports),
      bins: getBinKeys(pkg.bin),
    });
  }

  return summaries.sort((left, right) => left.directory.localeCompare(right.directory));
}
