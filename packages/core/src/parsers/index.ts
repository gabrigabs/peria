/**
 * Parsers index - stubs for future implementation
 */

/**
 * Placeholder for code parser (will use ts-morph in future)
 */
export async function parseCode(_filepath: string): Promise<unknown> {
  throw new Error('Code parsing not implemented yet')
}

/**
 * Placeholder for Markdown parser (will use unified/remark in future)
 */
export async function parseMarkdown(_filepath: string): Promise<unknown> {
  throw new Error('Markdown parsing not implemented yet')
}

/**
 * Placeholder for OpenAPI parser
 */
export async function parseOpenAPI(_filepath: string): Promise<unknown> {
  throw new Error('OpenAPI parsing not implemented yet')
}

/**
 * Placeholder for llms.txt parser
 */
export async function parseLlms(_filepath: string): Promise<unknown> {
  throw new Error('llms.txt parsing not implemented yet')
}
