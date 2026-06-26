/**
 * Tests for entrypoint detection
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  detectEntrypoint,
  getEntrypointOptions,
  scanForEntrypoints,
} from '../detectors/entrypoint.js';

const testDir = join(import.meta.dirname, 'test-entrypoint-tmp');

describe('detectEntrypoint', () => {
  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
    await mkdir(join(testDir, 'src'), { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns null when no entrypoint exists', async () => {
    const result = await detectEntrypoint(testDir);
    expect(result).toBeNull();
  });

  it('finds src/main.ts when it exists', async () => {
    await writeFile(join(testDir, 'src', 'main.ts'), '// main');
    const result = await detectEntrypoint(testDir);
    expect(result).toBe('src/main.ts');
  });

  it('finds src/index.ts as fallback', async () => {
    await writeFile(join(testDir, 'src', 'index.ts'), '// index');
    const result = await detectEntrypoint(testDir);
    expect(result).toBe('src/index.ts');
  });

  it('finds server.ts in root', async () => {
    await writeFile(join(testDir, 'server.ts'), '// server');
    const result = await detectEntrypoint(testDir);
    expect(result).toBe('server.ts');
  });

  it('finds app.ts in root', async () => {
    await writeFile(join(testDir, 'app.ts'), '// app');
    const result = await detectEntrypoint(testDir);
    expect(result).toBe('app.ts');
  });

  it('returns first matching candidate', async () => {
    await writeFile(join(testDir, 'src', 'main.ts'), '// main');
    await writeFile(join(testDir, 'src', 'index.ts'), '// index');
    const result = await detectEntrypoint(testDir);
    // main.ts should be found first based on DEFAULT_ENTRYPOINT_CANDIDATES order
    expect(result).toBe('src/main.ts');
  });
});

describe('getEntrypointOptions', () => {
  it('returns array of candidate paths', () => {
    const options = getEntrypointOptions();
    expect(options.length).toBeGreaterThan(0);
    expect(options).toContain('src/main.ts');
    expect(options).toContain('src/index.ts');
    expect(options).toContain('server.ts');
    expect(options).toContain('app.ts');
  });
});

describe('scanForEntrypoints', () => {
  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
    await mkdir(join(testDir, 'src'), { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns default candidates when no files found', async () => {
    const result = await scanForEntrypoints(testDir);
    expect(result).toEqual(getEntrypointOptions());
  });

  it('finds TypeScript files in src/', async () => {
    await writeFile(join(testDir, 'src', 'main.ts'), '// main');
    await writeFile(join(testDir, 'src', 'users.ts'), '// users');
    const result = await scanForEntrypoints(testDir);
    expect(result).toContain('src/main.ts');
    expect(result).toContain('src/users.ts');
  });

  it('finds server.ts and app.ts', async () => {
    await writeFile(join(testDir, 'server.ts'), '// server');
    await writeFile(join(testDir, 'app.ts'), '// app');
    const result = await scanForEntrypoints(testDir);
    expect(result).toContain('server.ts');
    expect(result).toContain('app.ts');
  });
});
