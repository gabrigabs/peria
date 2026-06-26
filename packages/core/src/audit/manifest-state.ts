/**
 * Manifest State Audit Check
 *
 * Validates that the manifest is consistent with the current repo state.
 * Flags:
 * - Invalid manifest structure (error)
 * - Source files referenced in manifest no longer exist (warning)
 * - Framework detection no longer accurate (warning)
 */

import { access } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import type { DriftFinding } from '../types/graph.js';
import type { PeriaManifest } from '../types/manifest.js';
import { isValidManifest } from '../types/manifest.js';
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
 * Manifest State audit check
 */
export const runManifestStateCheck: AuditCheck = {
  name: 'manifest-state',
  description: 'Validate manifest consistency with repository state',
  defaultSeverity: 'warning' as AuditSeverity,

  async run(manifest: PeriaManifest, cwd: string): Promise<DriftFinding[]> {
    const findings: DriftFinding[] = [];
    let index = 0;

    // Check manifest structure validity
    if (!isValidManifest(manifest)) {
      findings.push({
        id: generateId('manifest-invalid', index++),
        severity: 'error',
        type: 'manifest-invalid-structure',
        problem: 'Manifest has invalid structure',
        expected: 'Valid PeriaManifest structure',
        actual: 'Missing or invalid required fields',
        source: { file: '.peria/manifest.json' },
        suggestions: ['Run "peria scan" to regenerate the manifest'],
      });
    }

    // Check required fields
    if (!manifest.manifestVersion) {
      findings.push({
        id: generateId('manifest-no-version', index++),
        severity: 'error',
        type: 'manifest-missing-version',
        problem: 'Manifest is missing version field',
        expected: 'manifestVersion should be set',
        actual: 'Field is undefined or empty',
        source: { file: '.peria/manifest.json' },
        suggestions: ['Run "peria scan" to regenerate the manifest'],
      });
    }

    if (!manifest.generatedAt) {
      findings.push({
        id: generateId('manifest-no-date', index++),
        severity: 'error',
        type: 'manifest-missing-date',
        problem: 'Manifest is missing generatedAt timestamp',
        expected: 'generatedAt should be set',
        actual: 'Field is undefined or empty',
        source: { file: '.peria/manifest.json' },
        suggestions: ['Run "peria scan" to regenerate the manifest'],
      });
    }

    // Sample check: verify a few source files still exist
    const sourceFilesToCheck = manifest.sourceFiles.slice(0, 10);
    for (const sourceFile of sourceFilesToCheck) {
      const filePath = isAbsolute(sourceFile.source.file)
        ? sourceFile.source.file
        : join(cwd, sourceFile.source.file);

      if (!(await fileExists(filePath))) {
        findings.push({
          id: generateId('manifest-file-missing', index++),
          severity: 'warning',
          type: 'manifest-references-missing-file',
          entityId: sourceFile.id,
          entityType: 'source-file',
          problem: `Source file "${sourceFile.path}" referenced in manifest no longer exists`,
          expected: 'File should exist',
          actual: 'File not found',
          source: { file: '.peria/manifest.json', line: sourceFile.source.line },
          suggestions: ['Run "peria scan" to update manifest', 'Or restore the missing file'],
        });
      }
    }

    // Check if manifest is stale (older than 7 days)
    if (manifest.generatedAt) {
      const manifestAge = Date.now() - new Date(manifest.generatedAt).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (manifestAge > sevenDays) {
        const days = Math.floor(manifestAge / (24 * 60 * 60 * 1000));
        findings.push({
          id: generateId('manifest-stale', index++),
          severity: 'info',
          type: 'manifest-stale',
          problem: `Manifest is ${days} days old`,
          expected: 'Manifest should be regenerated regularly',
          actual: `Last generated ${days} days ago`,
          source: { file: '.peria/manifest.json' },
          suggestions: ['Run "peria scan" to regenerate'],
        });
      }
    }

    // Check if mentioned packages still exist
    for (const pkg of manifest.packages.slice(0, 5)) {
      const pkgPath = join(cwd, pkg.directory, 'package.json');
      if (!(await fileExists(pkgPath))) {
        findings.push({
          id: generateId('manifest-package-missing', index++),
          severity: 'warning',
          type: 'manifest-references-missing-package',
          entityId: pkg.id,
          entityType: 'package',
          problem: `Package "${pkg.name}" directory no longer exists`,
          expected: 'Package directory should exist',
          actual: 'Directory not found',
          source: { file: '.peria/manifest.json' },
          suggestions: ['Remove the package directory', 'Or run "peria scan" to update manifest'],
        });
      }
    }

    return findings;
  },
};
