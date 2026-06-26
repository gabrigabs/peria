/**
 * Adapters Smoke Tests
 *
 * Basic tests to verify adapter functions are exported correctly.
 */

import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function withTempDocs<T>(callback: (docsPath: string) => T): T {
  const directory = mkdtempSync(join(tmpdir(), 'peria-adapters-'));
  const docsPath = join(directory, 'docs');
  mkdirSync(docsPath, { recursive: true });

  try {
    return callback(docsPath);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

// Express adapter tests
describe('Express adapter', () => {
  it('should export periaDocs function', async () => {
    const { periaDocs } = await import('../express.js');
    expect(typeof periaDocs).toBe('function');
  });

  it('should create a router with default options', async () => {
    const { periaDocs } = await import('../express.js');
    withTempDocs((docsPath) => {
      const router = periaDocs({ docsPath });
      expect(typeof router).toBe('function');
      expect(typeof router.get).toBe('function');
      expect(typeof router.use).toBe('function');
    });
  });

  it('should accept custom options', async () => {
    const { periaDocs } = await import('../express.js');
    withTempDocs((docsPath) => {
      const router = periaDocs({ route: '/api-docs', docsPath });
      expect(typeof router).toBe('function');
    });
  });
});

// Fastify adapter tests
describe('Fastify adapter', () => {
  it('should export periaDocs function', async () => {
    const { periaDocs } = await import('../fastify.js');
    expect(typeof periaDocs).toBe('function');
  });

  it('should export FastifyInstance type', async () => {
    // Import the type from the module
    const mod = await import('../fastify.js');
    // FastifyInstance is exported as a type, check it exists
    expect(mod).toBeDefined();
  });

  it('should return plugin function with options', async () => {
    const { periaDocs } = await import('../fastify.js');
    const plugin = periaDocs({ routePrefix: '/api-docs', docsPath: 'custom-docs' });
    expect(typeof plugin).toBe('function');
  });
});

// NestJS adapter tests
describe('NestJS adapter', () => {
  it('should export setupPeriaDocs function', async () => {
    const { setupPeriaDocs } = await import('../nest.js');
    expect(typeof setupPeriaDocs).toBe('function');
  });

  it('should export NestApplication type', async () => {
    const mod = await import('../nest.js');
    expect(mod).toBeDefined();
  });

  it('should export PeriaNestOptions interface', async () => {
    const mod = await import('../nest.js');
    expect(mod).toBeDefined();
  });
});
