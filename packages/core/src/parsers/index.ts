/**
 * Parsers index - Peria parsers for code, Markdown, OpenAPI, and llms.txt
 */

export { parseLlms, parseLlmsContent } from './llms.js';
export { parseMarkdown, parseMarkdownWithUnified } from './markdown.js';
export { parseOpenAPI, parseOpenAPIDetailed } from './openapi.js';

// Placeholder for code parsing (deprecated - use framework adapters)
export async function parseCode(_filepath: string): Promise<unknown> {
  console.warn('parseCode is deprecated. Use framework adapters instead.');
  return { filepath: _filepath, parsed: false };
}
