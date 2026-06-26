/**
 * Package Context Generator
 *
 * Generate context for a specific package including modules, exports, and dependencies.
 */

import type { PackageContextPack, ContextPackOptions } from './types.js';
import type { PackageEntity } from '../types/graph.js';
import { generateContextPackId } from './types.js';

/**
 * Default maximum lines for package context
 */
const DEFAULT_MAX_LINES = 300;

/**
 * Generate context for a specific package
 */
export function generatePackageContext(
  pkg: PackageEntity,
  options: ContextPackOptions
): PackageContextPack {
  const maxLines = options.maxSize ?? DEFAULT_MAX_LINES;
  const content = buildPackageContextContent(pkg);
  const truncatedContent = truncateToLines(content, maxLines);

  return {
    id: generateContextPackId('package', pkg.id),
    variant: 'package',
    title: pkg.name,
    description: `Context for package ${pkg.name}`,
    generatedAt: new Date().toISOString(),
    content: truncatedContent,
    sourceFiles: [pkg.source],
    relatedEntities: [pkg.id],
    confidence: pkg.confidence,
    packageId: pkg.id,
    packageName: pkg.name,
  };
}

/**
 * Build the content string for a package context
 */
function buildPackageContextContent(pkg: PackageEntity): string {
  const lines: string[] = [];
  const exports = pkg.exports ?? [];
  const dependencies = pkg.dependencies ?? [];

  // Header
  lines.push(`# Package Context: ${pkg.name}`);
  lines.push('');
  lines.push(`**Directory:** \`${pkg.directory}\``);
  if (pkg.version) {
    lines.push(`**Version:** ${pkg.version}`);
  }
  lines.push(`**Confidence:** ${pkg.confidence}`);
  lines.push('');

  // Package Info
  lines.push('## Package Information');
  lines.push('');
  if (pkg.description) {
    lines.push(`**Description:** ${pkg.description}`);
  }
  lines.push('');

  // Exports
  if (exports.length > 0) {
    lines.push('## Public Exports');
    lines.push('');
    for (const exp of exports) {
      lines.push(`- \`${exp}\``);
    }
    lines.push('');
  }

  // Dependencies
  if (dependencies.length > 0) {
    lines.push('## Dependencies');
    lines.push('');
    for (const dep of dependencies.slice(0, 20)) {
      lines.push(`- \`${dep}\``);
    }
    if (dependencies.length > 20) {
      lines.push(`- ... and ${dependencies.length - 20} more`);
    }
    lines.push('');
  }

  // Source
  lines.push('## Source');
  lines.push('');
  lines.push(`**Main file:** ${pkg.source.file}:${pkg.source.line}`);
  lines.push('');

  // Agent Instructions
  lines.push('## Agent Instructions');
  lines.push('');
  lines.push(`Before editing this package (${pkg.name}):`);
  lines.push('');
  lines.push('1. Check the public exports to understand the public API');
  lines.push('2. Update exports if adding new public APIs');
  lines.push('3. Run tests after changes');
  lines.push('4. Run `peria check` to verify no drift');
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
