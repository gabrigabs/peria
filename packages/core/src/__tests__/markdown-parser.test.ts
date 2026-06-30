/**
 * Tests for Markdown parser
 */

import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '../parsers/markdown.js';

describe('parseMarkdown', () => {
  it('parses basic markdown content', async () => {
    const content = `# Hello World

This is a test document.

## Section 1

Some content here.
`;

    const result = await parseMarkdown('test.md', content);

    expect(result.id).toBe('markdown:test.md');
    expect(result.type).toBe('markdown');
    expect(result.path).toBe('test.md');
    expect(result.content).toBe(content);
  });

  it('extracts route mentions', async () => {
    const content = `Use POST /users to create a user.`;

    const result = await parseMarkdown('api.md', content);
    const mentions = (result.metadata as { routeMentions: unknown[] }).routeMentions;

    expect(mentions.length).toBeGreaterThan(0);
  });

  it('normalizes route mentions in inline code and skips URLs', async () => {
    const content = `Document \`GET /users/:id\` and open http://127.0.0.1:3000/api/users.`;

    const result = await parseMarkdown('api.md', content);
    const mentions = (result.metadata as { routeMentions: Array<{ path: string }> })
      .routeMentions;

    expect(mentions.map((mention) => mention.path)).toContain('/users/:id');
    expect(mentions.map((mention) => mention.path)).not.toContain('//127');
  });

  it('extracts schema references', async () => {
    const content = `Create a user with CreateUserRequest.`;

    const result = await parseMarkdown('user.md', content);
    const refs = (result.metadata as { schemaRefs: unknown[] }).schemaRefs;

    expect(refs.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts frontmatter', async () => {
    const content = `---
title: API Reference
description: Complete API documentation
---

# Content
`;

    const result = await parseMarkdown('with-frontmatter.md', content);

    expect(result.frontmatter?.title).toBe('API Reference');
  });

  it('extracts source file links', async () => {
    const content = `See [Controller](src/users/users.controller.ts) for implementation.`;

    const result = await parseMarkdown('guide.md', content);
    const links = (result.metadata as { sourceLinks: unknown[] }).sourceLinks;

    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts language hints', async () => {
    const content = '```typescript\nconst x = 1;\n```';

    const result = await parseMarkdown('examples.md', content);
    const hints = (result.metadata as { languageHints: string[] }).languageHints;

    expect(hints).toContain('typescript');
  });

  it('counts words', async () => {
    const content = `# Test

This is a simple test document with some words.
`;

    const result = await parseMarkdown('words.md', content);
    const wordCount = (result.metadata as { wordCount: number }).wordCount;

    expect(wordCount).toBeGreaterThan(0);
  });

  it('detects code blocks', async () => {
    const result = await parseMarkdown('test.md', '```ts\ncode\n```');
    expect((result.metadata as { hasCodeBlocks: boolean }).hasCodeBlocks).toBe(true);
  });
});
