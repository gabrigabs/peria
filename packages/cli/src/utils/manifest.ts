/**
 * Manifest utilities for CLI
 */

import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PeriaManifest } from '@peria/core';

/**
 * Default manifest path
 */
export const DEFAULT_MANIFEST_PATH = '.peria/manifest.json';

/**
 * Check if manifest exists
 */
export async function manifestExists(cwd: string): Promise<boolean> {
  const manifestPath = join(cwd, DEFAULT_MANIFEST_PATH);
  try {
    await access(manifestPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read manifest from disk
 */
export async function readManifest(cwd: string): Promise<PeriaManifest | null> {
  const manifestPath = join(cwd, DEFAULT_MANIFEST_PATH);

  try {
    const content = await readFile(manifestPath, 'utf-8');
    return JSON.parse(content) as PeriaManifest;
  } catch {
    return null;
  }
}

/**
 * Get manifest path
 */
export function getManifestPath(cwd: string): string {
  return join(cwd, DEFAULT_MANIFEST_PATH);
}
