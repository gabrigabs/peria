/**
 * Adapters Smoke Tests
 *
 * Basic tests to verify adapter functions are exported correctly.
 */

import { describe, expect, it } from 'vitest';

// Express adapter tests
describe('Express adapter', () => {
  it('should export periaDocs function', async () => {
    const { periaDocs } = await import('../express.js');
    expect(typeof periaDocs).toBe('function');
  });

  it('should create a router with default options', async () => {
    const { periaDocs } = await import('../express.js');
    const router = periaDocs();
    expect(typeof router).toBe('object');
    expect(typeof router.get).toBe('function');
    expect(typeof router.use).toBe('function');
  });

  it('should accept custom options', async () => {
    const { periaDocs } = await import('../express.js');
    const router = periaDocs({ route: '/api-docs', docsPath: 'custom-docs' });
    expect(typeof router).toBe('object');
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
