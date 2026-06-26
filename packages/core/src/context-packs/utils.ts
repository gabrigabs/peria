/**
 * Shared utilities for context packs
 */

/**
 * Truncate content to a maximum number of lines
 */
export function truncateToLines(content: string, maxLines: number): string {
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

/**
 * Sanitize a string for use as an ID
 */
export function sanitizeId(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
}
