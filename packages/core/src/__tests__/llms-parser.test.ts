/**
 * Tests for llms.txt parser
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseLlms, parseLlmsContent } from '../parsers/llms.js';

const FIXTURES_DIR = join(import.meta.dirname, 'fixtures');

beforeAll(async () => {
  try {
    await mkdir(FIXTURES_DIR, { recursive: true });
  } catch {
    // Ignore
  }
});

afterAll(async () => {
  try {
    await rm(FIXTURES_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
});

describe('parseLlmsContent', () => {
  it('parses basic llms.txt content', () => {
    const content = `# Project Wiki

## Pages

- Overview: docs/pages/overview.md
`;

    const result = parseLlmsContent('llms.txt', content);

    expect(result.id).toBe('llms:llms.txt');
    expect(result.type).toBe('llms');
    expect(result.path).toBe('llms.txt');
    expect(result.variant).toBeTruthy();
  });

  it('detects summary variant', () => {
    const shortContent = `# Summary

- Home: docs/home.md
`;

    const result = parseLlmsContent('llms.txt', shortContent);
    expect(result.variant).toBe('summary');
  });

  it('extracts sections', () => {
    const content = `# Main Title

## Section One

Content.
`;

    const result = parseLlmsContent('llms.txt', content);
    expect((result.metadata as { sectionCount: number }).sectionCount).toBeGreaterThan(0);
  });

  it('counts lines', () => {
    const content = `Line 1
Line 2
Line 3
`;

    const result = parseLlmsContent('llms.txt', content);
    expect((result.metadata as { lineCount: number }).lineCount).toBeGreaterThanOrEqual(3);
  });
});

describe('parseLlms', () => {
  it('handles non-existent file', async () => {
    const result = await parseLlms('non-existent-llms.txt');

    expect(result.id).toBe('llms:non-existent-llms.txt');
    expect((result.metadata as { exists: boolean }).exists).toBe(false);
  });

  it('parses actual file', async () => {
    const content = `# Project Documentation

- Introduction: docs/intro.md
`;

    const filePath = join(FIXTURES_DIR, 'test-llms.txt');
    await writeFile(filePath, content);

    const result = await parseLlms(filePath);

    expect((result.metadata as { exists: boolean }).exists).toBe(true);
    expect(result.content).toBe(content);
  });
});
