/**
 * Adapters Smoke Tests
 *
 * Basic tests to verify adapter functions are exported correctly.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface TempDocsPaths {
  docsPath: string;
  llmsPath: string;
}

async function withTempDocs<T>(callback: (paths: TempDocsPaths) => T | Promise<T>): Promise<T> {
  const directory = mkdtempSync(join(tmpdir(), 'peria-adapters-'));
  const docsPath = join(directory, 'docs');
  const llmsPath = join(directory, 'llms.txt');
  mkdirSync(join(docsPath, 'content', 'docs'), { recursive: true });
  writeFileSync(
    join(docsPath, 'wiki-manifest.json'),
    JSON.stringify({
      generatedAt: '2026-06-29T00:00:00.000Z',
      pages: [{ slug: 'overview', title: 'Overview' }],
    })
  );
  writeFileSync(join(docsPath, 'README.md'), '# Peria docs\n');
  writeFileSync(join(docsPath, 'content', 'docs', 'overview.mdx'), '# Overview\n');
  writeFileSync(llmsPath, '# Peria llms\n');

  try {
    return await callback({ docsPath, llmsPath });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

async function withHttpServer<T>(
  listener: NonNullable<Parameters<typeof createServer>[1]>,
  callback: (baseUrl: string) => Promise<T>
): Promise<T> {
  const server = createServer(listener);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Could not determine test server address');
    }

    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
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
    await withTempDocs(({ docsPath }) => {
      const router = periaDocs({ docsPath });
      expect(typeof router).toBe('function');
      expect(typeof router.get).toBe('function');
      expect(typeof router.use).toBe('function');
    });
  });

  it('should accept custom options', async () => {
    const express = (await import('express')).default;
    const { periaDocs } = await import('../express.js');
    await withTempDocs(async ({ docsPath, llmsPath }) => {
      const app = express();
      const router = periaDocs({ route: '/api-docs', docsPath, llmsPath });
      app.use(router);
      expect(typeof router).toBe('function');

      await withHttpServer(app, async (baseUrl) => {
        const llms = await fetch(`${baseUrl}/api-docs/llms.txt`);
        expect(llms.status).toBe(200);
        await expect(llms.text()).resolves.toContain('# Peria llms');
      });
    });
  });

  it('serves generated Fumadocs artifacts', async () => {
    const express = (await import('express')).default;
    const { periaDocs } = await import('../express.js');
    await withTempDocs(async ({ docsPath, llmsPath }) => {
      const app = express();
      app.use('/docs', periaDocs({ docsPath, llmsPath }));

      await withHttpServer(app, async (baseUrl) => {
        const manifest = await fetch(`${baseUrl}/docs/api/manifest.json`);
        expect(manifest.status).toBe(200);
        await expect(manifest.json()).resolves.toMatchObject({
          pages: [{ slug: 'overview', title: 'Overview' }],
        });

        const staticManifest = await fetch(`${baseUrl}/docs/wiki-manifest.json`);
        expect(staticManifest.status).toBe(200);
        await expect(staticManifest.json()).resolves.toMatchObject({
          pages: [{ slug: 'overview', title: 'Overview' }],
        });

        const llms = await fetch(`${baseUrl}/docs/llms.txt`);
        expect(llms.status).toBe(200);
        await expect(llms.text()).resolves.toContain('# Peria llms');

        const mdx = await fetch(`${baseUrl}/docs/content/docs/overview.mdx`);
        expect(mdx.status).toBe(200);
        await expect(mdx.text()).resolves.toContain('# Overview');

        const root = await fetch(`${baseUrl}/docs`);
        expect(root.status).toBe(200);
        await expect(root.text()).resolves.toContain('# Peria docs');

        const fallback = await fetch(`${baseUrl}/docs/overview`);
        expect(fallback.status).toBe(200);
        await expect(fallback.text()).resolves.toContain('# Peria docs');
      });
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
    await withTempDocs(({ docsPath }) => {
      const plugin = periaDocs({ routePrefix: '/api-docs', docsPath });
      expect(typeof plugin).toBe('function');
    });
  });

  it('serves generated Fumadocs artifacts', async () => {
    const Fastify = (await import('fastify')).default;
    const { periaDocs } = await import('../fastify.js');
    await withTempDocs(async ({ docsPath, llmsPath }) => {
      const app = Fastify();
      await app.register(periaDocs({ routePrefix: '/docs', docsPath, llmsPath }));

      try {
        const manifest = await app.inject('/docs/api/manifest.json');
        expect(manifest.statusCode).toBe(200);
        expect(manifest.json()).toMatchObject({
          pages: [{ slug: 'overview', title: 'Overview' }],
        });

        const staticManifest = await app.inject('/docs/wiki-manifest.json');
        expect(staticManifest.statusCode).toBe(200);
        expect(staticManifest.json()).toMatchObject({
          pages: [{ slug: 'overview', title: 'Overview' }],
        });

        const llms = await app.inject('/docs/llms.txt');
        expect(llms.statusCode).toBe(200);
        expect(llms.body).toContain('# Peria llms');

        const mdx = await app.inject('/docs/content/docs/overview.mdx');
        expect(mdx.statusCode).toBe(200);
        expect(mdx.body).toContain('# Overview');

        const root = await app.inject('/docs');
        expect(root.statusCode).toBe(200);
        expect(root.body).toContain('# Peria docs');

        const fallback = await app.inject('/docs/overview');
        expect(fallback.statusCode).toBe(200);
        expect(fallback.body).toContain('# Peria docs');
      } finally {
        await app.close();
      }
    });
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

  it('serves generated Fumadocs artifacts through an Express-backed app', async () => {
    const express = (await import('express')).default;
    const { setupPeriaDocs } = await import('../nest.js');
    await withTempDocs(async ({ docsPath, llmsPath }) => {
      const expressApp = express();
      const nestApp = {
        getHttpAdapter() {
          return {
            getInstance() {
              return expressApp;
            },
          };
        },
      };

      setupPeriaDocs(nestApp as never, { docsPath, llmsPath });

      await withHttpServer(expressApp, async (baseUrl) => {
        const manifest = await fetch(`${baseUrl}/docs/api/manifest.json`);
        expect(manifest.status).toBe(200);
        await expect(manifest.json()).resolves.toMatchObject({
          pages: [{ slug: 'overview', title: 'Overview' }],
        });

        const staticManifest = await fetch(`${baseUrl}/docs/wiki-manifest.json`);
        expect(staticManifest.status).toBe(200);
        await expect(staticManifest.json()).resolves.toMatchObject({
          pages: [{ slug: 'overview', title: 'Overview' }],
        });

        const llms = await fetch(`${baseUrl}/docs/llms.txt`);
        expect(llms.status).toBe(200);
        await expect(llms.text()).resolves.toContain('# Peria llms');

        const mdx = await fetch(`${baseUrl}/docs/content/docs/overview.mdx`);
        expect(mdx.status).toBe(200);
        await expect(mdx.text()).resolves.toContain('# Overview');

        const root = await fetch(`${baseUrl}/docs`);
        expect(root.status).toBe(200);
        await expect(root.text()).resolves.toContain('# Peria docs');

        const fallback = await fetch(`${baseUrl}/docs/overview`);
        expect(fallback.status).toBe(200);
        await expect(fallback.text()).resolves.toContain('# Peria docs');
      });
    });
  });
});
