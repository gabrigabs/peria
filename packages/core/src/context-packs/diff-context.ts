/**
 * Diff Context Generator
 *
 * Generate context from git diff to understand impact on routes, schemas, and packages.
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { DiffContextPack, ContextPackOptions } from './types.js';
import { generateContextPackId } from './types.js';

const execAsync = promisify(exec);

/**
 * Default maximum lines for diff context
 */
const DEFAULT_MAX_LINES = 300;

/**
 * Git diff result
 */
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
 * Generate context from git diff
 */
export async function generateDiffContext(
  options: ContextPackOptions & {
    baseCommit?: string;
    headCommit?: string;
    affectedRouteCount?: number;
    affectedSchemaCount?: number;
    affectedPackageCount?: number;
  }
): Promise<DiffContextPack> {
  const maxLines = options.maxSize ?? DEFAULT_MAX_LINES;
  const diff = await getGitDiff(options.cwd, options.baseCommit);

  const impactLevel = calculateImpactLevel(
    diff.files.length,
    options.affectedRouteCount ?? 0,
    options.affectedSchemaCount ?? 0
  );

  const content = buildDiffContextContent(diff, {
    affectedRouteCount: options.affectedRouteCount ?? 0,
    affectedSchemaCount: options.affectedSchemaCount ?? 0,
    affectedPackageCount: options.affectedPackageCount ?? 0,
    impactLevel,
  });

  const truncatedContent = truncateToLines(content, maxLines);

  return {
    id: generateContextPackId('diff'),
    variant: 'diff',
    title: `Git Diff Context (${diff.summary.modified} modified)`,
    description: `Context from ${diff.summary.added} added, ${diff.summary.modified} modified, ${diff.summary.deleted} deleted files`,
    generatedAt: new Date().toISOString(),
    content: truncatedContent,
    sourceFiles: diff.files.map((f) => ({ file: f.path, line: 1 })),
    relatedEntities: [],
    confidence: 'high',
    changedFiles: diff.files.map((f) => f.path),
    affectedRouteCount: options.affectedRouteCount ?? 0,
    affectedSchemaCount: options.affectedSchemaCount ?? 0,
    affectedPackageCount: options.affectedPackageCount ?? 0,
    impactLevel,
  };
}

/**
 * Calculate impact level based on changed files
 */
function calculateImpactLevel(
  fileCount: number,
  routeCount: number,
  schemaCount: number
): 'high' | 'medium' | 'low' {
  if (fileCount >= 10 || routeCount >= 3 || schemaCount >= 5) {
    return 'high';
  }
  if (fileCount >= 3 || routeCount >= 1 || schemaCount >= 2) {
    return 'medium';
  }
  return 'low';
}

/**
 * Get git diff
 */
async function getGitDiff(cwd: string, sinceCommit?: string): Promise<GitDiffResult> {
  const result: GitDiffResult = {
    files: [],
    summary: { added: 0, modified: 0, deleted: 0 },
  };

  try {
    const diffArgs = sinceCommit
      ? `diff --name-status ${sinceCommit} HEAD`
      : 'diff --name-status HEAD';

    const { stdout } = await execAsync(`git ${diffArgs}`, { cwd });
    const output = stdout.trim();

    if (!output) {
      return result;
    }

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
 * Build the content string for a diff context
 */
function buildDiffContextContent(
  diff: GitDiffResult,
  impact: {
    affectedRouteCount: number;
    affectedSchemaCount: number;
    affectedPackageCount: number;
    impactLevel: 'high' | 'medium' | 'low';
  }
): string {
  const lines: string[] = [];

  // Header
  lines.push('# Git Diff Context');
  lines.push('');
  lines.push(`**Summary:** ${diff.summary.added} added, ${diff.summary.modified} modified, ${diff.summary.deleted} deleted`);
  lines.push(`**Impact Level:** ${impact.impactLevel.toUpperCase()}`);
  lines.push('');

  // Impact Summary
  lines.push('## Impact Summary');
  lines.push('');
  lines.push(`| Category | Count |`);
  lines.push(`|----------|-------|`);
  lines.push(`| Files changed | ${diff.files.length} |`);
  lines.push(`| Routes affected | ${impact.affectedRouteCount} |`);
  lines.push(`| Schemas affected | ${impact.affectedSchemaCount} |`);
  lines.push(`| Packages affected | ${impact.affectedPackageCount} |`);
  lines.push('');

  // Changed Files
  lines.push('## Changed Files');
  lines.push('');
  lines.push('```');
  for (const file of diff.files.slice(0, 50)) {
    const icon = file.status === 'added' ? '+' : file.status === 'deleted' ? '-' : 'M';
    lines.push(`${icon} ${file.path}`);
  }
  if (diff.files.length > 50) {
    lines.push(`... and ${diff.files.length - 50} more files`);
  }
  lines.push('```');
  lines.push('');

  // Recommendations
  lines.push('## Recommendations');
  lines.push('');
  lines.push('Before reviewing this diff:');
  lines.push('');
  if (impact.affectedRouteCount > 0) {
    lines.push('1. Check affected routes for API contract changes');
    lines.push('2. Update OpenAPI documentation if routes changed');
  }
  if (impact.affectedSchemaCount > 0) {
    lines.push('3. Verify schema changes are backward compatible');
  }
  lines.push('4. Run `peria check` to detect new drift');
  lines.push('');

  return lines.join('\n');
}

/**
 * Truncate content to a maximum number of lines
 */
function truncateToLines(content: string, maxLines: number): string {
  const lines = content.split('\n');
  if (lines.length <= maxLines) {
    return content;
  }

  const truncated = lines.slice(0, maxLines);
  truncated.push('');
  truncated.push('---');
  truncated.push(`*[Content truncated: ${lines.length - maxLines} lines omitted]*`);

  return truncated.join('\n');
}
