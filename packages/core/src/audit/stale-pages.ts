/**
 * Stale Pages Audit Check
 *
 * Detects documentation pages that have been modified after the last scan.
 * Flags:
 * - Pages modified after manifest generation (warning)
 * - Pages with inconsistent state
 */

import { access, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { DriftFinding } from '../types/graph.js';
import type { PeriaManifest } from '../types/manifest.js';
import type { AuditCheck, AuditSeverity } from './types.js';

/**
 * Generate a unique ID for findings
 */
function generateId(prefix: string, index: number): string {
  return `audit-${prefix}-${Date.now().toString(36)}-${index}`;
}

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file modification time
 */
async function getMtime(path: string): Promise<Date | null> {
  try {
    const stats = await stat(path);
    return stats.mtime;
  } catch {
    return null;
  }
}

/**
 * Stale Pages audit check
 */
export const runStalePagesCheck: AuditCheck = {
  name: 'stale-pages',
  description: 'Detect documentation pages modified after last scan',
  defaultSeverity: 'warning' as AuditSeverity,

  async run(manifest: PeriaManifest, cwd: string): Promise<DriftFinding[]> {
    const findings: DriftFinding[] = [];
    let index = 0;

    // Skip if no manifest generation time
    if (!manifest.generatedAt) {
      return findings;
    }

    const manifestTime = new Date(manifest.generatedAt).getTime();

    // Check doc pages from manifest
    for (const docPage of manifest.docsPages) {
      const filePath = join(cwd, docPage.source.file);
      const mtime = await getMtime(filePath);

      if (mtime && mtime.getTime() > manifestTime) {
        // Calculate how long after the manifest
        const hoursSince = Math.round((mtime.getTime() - manifestTime) / (1000 * 60 * 60));

        findings.push({
          id: generateId('page-stale', index++),
          severity: 'info',
          type: 'doc-page-modified-after-scan',
          entityId: docPage.id,
          entityType: 'doc-page',
          problem: `Documentation page "${docPage.title}" was modified ${hoursSince} hours after last scan`,
          expected: 'Page should match manifest state',
          actual: `Modified ${hoursExists(hoursSince)} after manifest generation`,
          source: docPage.source,
          suggestions: ['Run "peria scan" to capture changes'],
        });
      }
    }

    // Check if generated docs directory exists but is not tracked
    const docsDir = join(cwd, 'docs');
    if (await fileExists(docsDir)) {
      try {
        const files = await readdir(docsDir, { withFileTypes: true });

        for (const file of files) {
          if (!file.isFile()) continue;

          // Check for common doc formats
          const ext = file.name.slice(file.name.lastIndexOf('.'));
          if (!['.md', '.mdx', '.html'].includes(ext)) continue;

          const filePath = join(docsDir, file.name);
          const mtime = await getMtime(filePath);

          // Check if page is not in manifest but exists on disk
          const isInManifest = manifest.docsPages.some((p) => p.source.file.endsWith(file.name));

          if (mtime && !isInManifest) {
            findings.push({
              id: generateId('page-untracked', index++),
              severity: 'info',
              type: 'doc-page-not-in-manifest',
              entityId: `doc:${file.name}`,
              entityType: 'doc-page',
              problem: `Documentation file "${file.name}" exists but is not in manifest`,
              expected: 'Page should be scanned',
              actual: 'Page not found in manifest',
              source: { file: filePath },
              suggestions: ['Run "peria scan" to include new pages'],
            });
          }
        }
      } catch {
        // Can't read docs directory, skip
      }
    }

    return findings;
  },
};

/**
 * Format hours for display
 */
function hoursExists(hours: number): string {
  if (hours < 1) return 'less than 1 hour';
  if (hours === 1) return '1 hour';
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day' : `${days} days`;
}
