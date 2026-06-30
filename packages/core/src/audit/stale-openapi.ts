/**
 * Stale OpenAPI Audit Check
 *
 * Detects when OpenAPI specs have been modified without regeneration.
 * Flags:
 * - Original OpenAPI modified after enriched version (error)
 * - Enriched OpenAPI missing (warning)
 */

import { access, readFile, stat } from 'node:fs/promises';
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
 * Stale OpenAPI audit check
 */
export const runStaleOpenAPICheck: AuditCheck = {
  name: 'stale-openapi',
  description: 'Detect OpenAPI specs modified after enrichment',
  defaultSeverity: 'warning' as AuditSeverity,

  async run(manifest: PeriaManifest, cwd: string): Promise<DriftFinding[]> {
    const findings: DriftFinding[] = [];
    let index = 0;

    // Check if we have OpenAPI metadata
    if (!manifest.openapi) {
      return findings;
    }

    const openapiPath = join(cwd, manifest.openapi.path);
    if (!manifest.openapi.enrichedPath) {
      return findings;
    }

    const enrichedPath = join(cwd, manifest.openapi.enrichedPath);

    const openapiExists = await fileExists(openapiPath);
    const enrichedExists = await fileExists(enrichedPath);

    // Check if OpenAPI file exists
    if (!openapiExists) {
      findings.push({
        id: generateId('openapi-missing', index++),
        severity: 'error',
        type: 'openapi-file-missing',
        problem: `OpenAPI file "${manifest.openapi.path}" no longer exists`,
        expected: 'OpenAPI file should exist',
        actual: 'File not found',
        source: { file: openapiPath },
        suggestions: ['Restore the OpenAPI file', 'Or update config to point to the correct file'],
      });
      return findings;
    }

    // Check enriched OpenAPI exists
    if (!enrichedExists) {
      findings.push({
        id: generateId('enriched-missing', index++),
        severity: 'warning',
        type: 'enriched-openapi-missing',
        problem: 'Enriched OpenAPI file is missing',
        expected: '.peria/openapi.enriched.json should exist',
        actual: 'File not found',
        source: { file: enrichedPath },
        suggestions: ['Run "peria scan" to regenerate enriched OpenAPI'],
      });
      return findings;
    }

    // Compare modification times
    const openapiMtime = await getMtime(openapiPath);
    const enrichedMtime = await getMtime(enrichedPath);

    if (openapiMtime && enrichedMtime) {
      if (openapiMtime.getTime() > enrichedMtime.getTime()) {
        // Calculate how long after
        const hoursSince = Math.round(
          (openapiMtime.getTime() - enrichedMtime.getTime()) / (1000 * 60 * 60)
        );

        findings.push({
          id: generateId('openapi-stale', index++),
          severity: 'error',
          type: 'openapi-modified-after-enrichment',
          problem: `OpenAPI file was modified ${hoursSince > 0 ? `${hoursSince} hours` : 'recently'} after enrichment`,
          expected: 'Enriched OpenAPI should be regenerated',
          actual: `Original OpenAPI is newer than enriched version`,
          source: { file: openapiPath },
          suggestions: ['Run "peria scan" to regenerate enriched OpenAPI'],
        });
      }
    }

    // Verify enriched OpenAPI content matches manifest
    try {
      const enrichedContent = await readFile(enrichedPath, 'utf-8');
      const enriched = JSON.parse(enrichedContent);

      // Check if x-peria metadata exists
      if (!enriched['x-peria']) {
        findings.push({
          id: generateId('enriched-no-metadata', index++),
          severity: 'warning',
          type: 'enriched-openapi-missing-metadata',
          problem: 'Enriched OpenAPI is missing x-peria metadata',
          expected: 'x-peria metadata should exist',
          actual: 'Metadata not found',
          source: { file: enrichedPath },
          suggestions: ['Run "peria scan" to regenerate with metadata'],
        });
      }

      // Check operation count matches
      const enrichedPaths = enriched.paths as Record<string, Record<string, unknown>> | undefined;
      const enrichedOps = enrichedPaths
        ? Object.values(enrichedPaths).flatMap((pathItem) => Object.values(pathItem)).length
        : 0;

      if (manifest.openapi.operationsCount !== enrichedOps) {
        findings.push({
          id: generateId('enriched-count-mismatch', index++),
          severity: 'warning',
          type: 'enriched-openapi-count-mismatch',
          problem: `Enriched OpenAPI has ${enrichedOps} operations but manifest expects ${manifest.openapi.operationsCount}`,
          expected: 'Operation counts should match',
          actual: 'Count mismatch',
          source: { file: enrichedPath },
          suggestions: ['Run "peria scan" to sync OpenAPI data'],
        });
      }
    } catch {
      // Can't read/parse enriched file, skip content checks
    }

    return findings;
  },
};
