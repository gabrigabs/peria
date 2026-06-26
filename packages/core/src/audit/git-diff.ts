/**
 * Git Diff Audit Check
 *
 * Analyzes changes since the last manifest generation.
 * Flags:
 * - Files changed that affect routes/schemas/docs (info)
 * - Changes that may require manifest regeneration (warning)
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import type { AuditCheck, AuditSeverity } from './types.js';
import type { DriftFinding } from '../types/graph.js';
import type { PeriaManifest } from '../types/manifest.js';

const execAsync = promisify(exec);

interface GitDiffResult {
  files: {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
  }[];
  summary: {
    added: number;
    modified: number;
    deleted: number;
  };
}

/**
 * Generate a unique ID for findings
 */
function generateId(prefix: string, index: number): string {
  return `audit-${prefix}-${Date.now().toString(36)}-${index}`;
}

/**
 * Run a git command
 */
async function runGit(command: string, cwd: string): Promise<string> {
  const { stdout } = await execAsync(command, { cwd });
  return stdout.trim();
}

/**
 * Get git diff since a specific commit
 */
async function getGitDiff(
  cwd: string,
  sinceCommit?: string
): Promise<GitDiffResult> {
  const result: GitDiffResult = {
    files: [],
    summary: { added: 0, modified: 0, deleted: 0 },
  };

  try {
    // Get diff with name-status
    const diffArgs = sinceCommit
      ? `diff --name-status ${sinceCommit} HEAD`
      : 'diff --name-status HEAD';

    const output = await runGit(diffArgs, cwd);

    if (!output) return result;

    for (const line of output.split('\n')) {
      if (!line.trim()) continue;

      const [statusChar, ...pathParts] = line.split('\t');
      const path = pathParts.join('\t');

      let status: 'added' | 'modified' | 'deleted' | 'renamed';

      switch (statusChar) {
        case 'A':
          status = 'added';
          result.summary.added++;
          break;
        case 'M':
          status = 'modified';
          result.summary.modified++;
          break;
        case 'D':
          status = 'deleted';
          result.summary.deleted++;
          break;
        case 'R':
          status = 'renamed';
          result.summary.modified++;
          break;
        default:
          continue;
      }

      result.files.push({ path, status });
    }
  } catch {
    // Git command failed, return empty result
  }

  return result;
}

/**
 * Check if a file affects routes
 */
function fileAffectsRoutes(filePath: string, manifest: PeriaManifest): string[] {
  const affected: string[] = [];

  // Check controller/route files
  for (const route of manifest.routes) {
    if (route.source.file === filePath) {
      affected.push(`${route.method} ${route.path}`);
    }
    // Also check if handler file matches
    if (route.handler?.file === filePath) {
      affected.push(`${route.method} ${route.path}`);
    }
  }

  return [...new Set(affected)];
}

/**
 * Check if a file affects schemas
 */
function fileAffectsSchemas(filePath: string, manifest: PeriaManifest): string[] {
  const affected: string[] = [];

  for (const schema of manifest.schemas) {
    if (schema.file === filePath) {
      affected.push(schema.name);
    }
  }

  return affected;
}

/**
 * Check if a file affects docs
 */
function fileAffectsDocs(filePath: string, manifest: PeriaManifest): string[] {
  const affected: string[] = [];

  for (const docPage of manifest.docsPages) {
    if (docPage.source.file === filePath) {
      affected.push(docPage.title);
    }
  }

  return affected;
}

/**
 * Categorize files by type
 */
function categorizeFile(filePath: string): 'route' | 'schema' | 'doc' | 'openapi' | 'other' {
  const lower = filePath.toLowerCase();

  if (
    lower.includes('controller') ||
    lower.includes('route') ||
    lower.includes('handler') ||
    lower.includes('.router') ||
    lower.includes('.routes')
  ) {
    return 'route';
  }

  if (
    lower.includes('dto') ||
    lower.includes('schema') ||
    lower.includes('entity') ||
    lower.includes('.interface') ||
    lower.includes('.type')
  ) {
    return 'schema';
  }

  if (
    lower.includes('docs') ||
    lower.includes('.md') ||
    lower.includes('.mdx')
  ) {
    return 'doc';
  }

  if (
    lower.includes('openapi') ||
    lower.endsWith('.yaml') ||
    lower.endsWith('.yml') ||
    lower.endsWith('swagger')
  ) {
    return 'openapi';
  }

  return 'other';
}

/**
 * Git Diff audit check
 */
export const runGitDiffCheck: AuditCheck = {
  name: 'git-diff',
  description: 'Analyze changes since last manifest generation',
  defaultSeverity: 'info' as AuditSeverity,

  async run(manifest: PeriaManifest, cwd: string): Promise<DriftFinding[]> {
    const findings: DriftFinding[] = [];
    let index = 0;

    // Get the commit when manifest was generated
    const manifestCommit = manifest.git?.lastCommit;
    if (!manifestCommit) {
      // No git info, skip this check
      return findings;
    }

    // Get diff
    const diff = await getGitDiff(cwd, manifestCommit);

    if (diff.files.length === 0) {
      return findings;
    }

    // Categorize affected entities
    let affectedRoutes: string[] = [];
    let affectedSchemas: string[] = [];
    let affectedDocs: string[] = [];
    let affectedOpenAPI = 0;

    const routeFiles = new Set<string>();
    const schemaFiles = new Set<string>();
    const docFiles = new Set<string>();

    for (const file of diff.files) {
      const category = categorizeFile(file.path);

      switch (category) {
        case 'route':
          affectedRoutes.push(...fileAffectsRoutes(file.path, manifest));
          routeFiles.add(file.path);
          break;
        case 'schema':
          affectedSchemas.push(...fileAffectsSchemas(file.path, manifest));
          schemaFiles.add(file.path);
          break;
        case 'doc':
          affectedDocs.push(...fileAffectsDocs(file.path, manifest));
          docFiles.add(file.path);
          break;
        case 'openapi':
          affectedOpenAPI++;
          break;
      }
    }

    // Deduplicate
    affectedRoutes = [...new Set(affectedRoutes)];
    affectedSchemas = [...new Set(affectedSchemas)];
    affectedDocs = [...new Set(affectedDocs)];

    // Summary finding
    if (diff.files.length > 0) {
      const summary = `${diff.summary.modified} modified, ${diff.summary.added} added, ${diff.summary.deleted} deleted`;

      findings.push({
        id: generateId('git-summary', index++),
        severity: 'info',
        type: 'git-changes-detected',
        problem: `${diff.files.length} files changed since last scan (${summary})`,
        expected: 'Manifest should be regenerated after significant changes',
        actual: `${diff.files.length} files have changed`,
        source: { file: '.peria/manifest.json', commit: manifestCommit },
        suggestions: ['Run "peria scan" to update manifest'],
        relatedEntities: [...affectedRoutes, ...affectedSchemas, ...affectedDocs],
      });
    }

    // Warning for route changes without OpenAPI updates
    if (routeFiles.size > 0 && affectedOpenAPI === 0) {
      findings.push({
        id: generateId('git-route-no-openapi', index++),
        severity: 'warning',
        type: 'git-routes-changed-no-openapi',
        problem: `${routeFiles.size} route file(s) changed but OpenAPI was not updated`,
        expected: 'OpenAPI should be updated when routes change',
        actual: 'No OpenAPI changes detected',
        source: { file: '.peria/manifest.json', commit: manifestCommit },
        suggestions: [
          'Update OpenAPI specification for the changed routes',
          'Or run "peria scan" to update enriched OpenAPI',
        ],
        relatedEntities: affectedRoutes,
      });
    }

    // Warning for OpenAPI changes without route changes
    if (affectedOpenAPI > 0 && routeFiles.size === 0) {
      findings.push({
        id: generateId('git-openapi-no-route', index++),
        severity: 'warning',
        type: 'git-openapi-changed-no-routes',
        problem: `${affectedOpenAPI} OpenAPI file(s) changed but no route files were updated`,
        expected: 'Routes should be updated when OpenAPI changes',
        actual: 'No route file changes detected',
        source: { file: '.peria/manifest.json', commit: manifestCommit },
        suggestions: [
          'Check if route files need updates',
          'Or verify the OpenAPI changes manually',
        ],
      });
    }

    // List specific affected routes
    if (affectedRoutes.length > 0 && affectedRoutes.length <= 10) {
      findings.push({
        id: generateId('git-routes-affected', index++),
        severity: 'info',
        type: 'git-affected-routes',
        problem: `${affectedRoutes.length} route(s) affected by recent changes`,
        expected: 'Route changes should be reflected in manifest',
        actual: affectedRoutes.join(', '),
        source: { file: '.peria/manifest.json', commit: manifestCommit },
        suggestions: affectedRoutes.map((r) => `Review route ${r}`),
        relatedEntities: affectedRoutes,
      });
    }

    return findings;
  },
};
