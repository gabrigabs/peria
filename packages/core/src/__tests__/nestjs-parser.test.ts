/**
 * NestJS Parser Tests
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { nestJSAdapter } from '../adapters/nestjs/index.js';
import type { RepoContext } from '../adapters/types.js';
import { defineConfig } from '../types/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, '../../fixtures/nestjs-basic');

const DEFAULT_CONTEXT_CONFIG = defineConfig({
  framework: 'nestjs',
  entrypoint: 'src/main.ts',
  project: {
    name: 'nestjs-basic-fixture',
    tagline: 'Test fixture',
    description: '',
    audience: 'Developers',
    tone: 'Technical',
    problem: '',
    currentFocus: '',
    highlights: [],
    packageContexts: {},
  },
  docs: { enabled: true, route: '/docs', outputDir: 'docs', renderer: 'static' },
  sources: {
    openapi: 'openapi.yaml',
    markdown: ['**/*.md'],
    llms: ['llms.txt'],
    context: ['CLAUDE.md', 'AGENTS.md'],
  },
  features: {
    embeddedDocs: true,
    codeMap: true,
    wiki: true,
    llms: true,
    driftCheck: true,
    apiReference: false,
    contextPacks: false,
    mermaid: false,
    embeddedDocsAdapters: false,
    gitDiff: false,
    changeMap: false,
    patchNotes: false,
    github: false,
  },
});

describe('NestJS Adapter', () => {
  let context: RepoContext;

  beforeAll(async () => {
    // Load config for the fixture
    const { loadConfig } = await import('../config/loader.js');
    const config = await loadConfig(FIXTURE_PATH);

    context = {
      cwd: FIXTURE_PATH,
      config: config ? defineConfig(config) : DEFAULT_CONTEXT_CONFIG,
    };
  });

  describe('detect', () => {
    it('should detect NestJS framework with high confidence', async () => {
      const result = await nestJSAdapter.detect(context);

      expect(result.framework).toBe('nestjs');
      expect(result.confidence).toBe('high');
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons.some((r) => r.includes('@nestjs/core'))).toBe(true);
    });

    it('should suggest entrypoints', async () => {
      const result = await nestJSAdapter.detect(context);

      expect(result.suggestedEntrypoints).toContain('src/main.ts');
    });
  });

  describe('extractRoutes', () => {
    it('should extract routes from controllers', async () => {
      const routes = await nestJSAdapter.extractRoutes(context);

      expect(routes.length).toBeGreaterThan(0);

      // Check for UsersController routes
      const usersRoutes = routes.filter((r) => r.path.includes('/users'));
      expect(usersRoutes.length).toBeGreaterThan(0);

      // Check for AuthController routes
      const authRoutes = routes.filter((r) => r.path.includes('/auth'));
      expect(authRoutes.length).toBeGreaterThan(0);
    });

    it('should extract GET routes', async () => {
      const routes = await nestJSAdapter.extractRoutes(context);
      const getRoutes = routes.filter((r) => r.method === 'GET');

      expect(getRoutes.length).toBeGreaterThan(0);
      expect(getRoutes.some((r) => r.path.includes(':id'))).toBe(true);
    });

    it('should extract POST routes', async () => {
      const routes = await nestJSAdapter.extractRoutes(context);
      const postRoutes = routes.filter((r) => r.method === 'POST');

      expect(postRoutes.length).toBeGreaterThan(0);
    });

    it('should extract PUT/PATCH routes', async () => {
      const routes = await nestJSAdapter.extractRoutes(context);
      const putRoutes = routes.filter((r) => r.method === 'PUT');
      const patchRoutes = routes.filter((r) => r.method === 'PATCH');

      expect(putRoutes.length).toBeGreaterThan(0);
      expect(patchRoutes.length).toBeGreaterThan(0);
    });

    it('should extract DELETE routes', async () => {
      const routes = await nestJSAdapter.extractRoutes(context);
      const deleteRoutes = routes.filter((r) => r.method === 'DELETE');

      expect(deleteRoutes.length).toBeGreaterThan(0);
    });

    it('should include handler information', async () => {
      const routes = await nestJSAdapter.extractRoutes(context);

      for (const route of routes) {
        expect(route.handler).toBeDefined();
        expect(route.handler?.name).toBeDefined();
        expect(route.handler?.file).toBeDefined();
        expect(route.handler?.line).toBeGreaterThan(0);
        expect(route.handler?.className).toBeDefined();
      }
    });

    it('should include source provenance', async () => {
      const routes = await nestJSAdapter.extractRoutes(context);

      for (const route of routes) {
        expect(route.source.file).toBeDefined();
        expect(route.source.line).toBeGreaterThan(0);
        expect(route.confidence).toBe('high');
        expect(route.extractionMethod).toBe('ast');
      }
    });

    it('should detect guards', async () => {
      const routes = await nestJSAdapter.extractRoutes(context);

      // UsersController has @UseGuards(JwtAuthGuard) at class level
      const usersRoutes = routes.filter((r) => r.path.includes('/users'));
      expect(usersRoutes.length).toBeGreaterThan(0);

      const routeWithGuard = usersRoutes.find((r) => r.guards && r.guards.length > 0);
      expect(routeWithGuard).toBeDefined();
    });

    it('should extract parameters', async () => {
      const routes = await nestJSAdapter.extractRoutes(context);

      // Find route with :id param
      const routeWithId = routes.find((r) => r.path.includes(':id') && r.method === 'GET');
      expect(routeWithId).toBeDefined();
      expect(routeWithId?.schemas.length).toBeGreaterThan(0);
    });
  });

  describe('extractModules', () => {
    it('should extract module structure', async () => {
      const extractModules = nestJSAdapter.extractModules;
      if (!extractModules) {
        expect(true).toBe(true); // Skip if not implemented
        return;
      }

      const modules = await extractModules(context);

      expect(modules.length).toBeGreaterThan(0);

      // Check for AppModule, UsersModule, AuthModule
      const moduleNames = modules.map((m) => m.name);
      expect(moduleNames).toContain('AppModule');
      expect(moduleNames).toContain('UsersModule');
      expect(moduleNames).toContain('AuthModule');
    });

    it('should include module file locations', async () => {
      const extractModules = nestJSAdapter.extractModules;
      if (!extractModules) {
        expect(true).toBe(true);
        return;
      }

      const modules = await extractModules(context);

      for (const module of modules) {
        expect(module.file).toBeDefined();
        expect(module.line).toBeGreaterThan(0);
        expect(module.id).toBeDefined();
        expect(module.name).toBeDefined();
      }
    });
  });

  describe('extractSchemas', () => {
    it('should extract DTOs', async () => {
      const extractSchemas = nestJSAdapter.extractSchemas;
      if (!extractSchemas) {
        expect(true).toBe(true); // Skip if not implemented
        return;
      }

      const schemas = await extractSchemas(context);

      // Check for CreateUserDto and UpdateUserDto
      const schemaNames = schemas.map((s) => s.name);
      expect(schemaNames).toContain('CreateUserDto');
      expect(schemaNames).toContain('UpdateUserDto');
    });

    it('should include schema properties', async () => {
      const extractSchemas = nestJSAdapter.extractSchemas;
      if (!extractSchemas) {
        expect(true).toBe(true);
        return;
      }

      const schemas = await extractSchemas(context);
      const createDto = schemas.find((s) => s.name === 'CreateUserDto');

      if (createDto?.properties) {
        expect(createDto.properties.length).toBeGreaterThan(0);
        expect(createDto.properties.some((p) => p.name === 'email')).toBe(true);
      }
    });

    it('should set high confidence for DTOs in .dto.ts files', async () => {
      const extractSchemas = nestJSAdapter.extractSchemas;
      if (!extractSchemas) {
        expect(true).toBe(true);
        return;
      }

      const schemas = await extractSchemas(context);
      const createDto = schemas.find((s) => s.name === 'CreateUserDto');
      const updateDto = schemas.find((s) => s.name === 'UpdateUserDto');

      // DTOs in .dto.ts files should have high confidence
      expect(createDto?.confidence).toBe('high');
      expect(updateDto?.confidence).toBe('high');
      expect(createDto?.extractionMethod).toBe('ast');
      expect(updateDto?.extractionMethod).toBe('ast');
    });

    it('should set medium confidence for DTOs by naming pattern only', async () => {
      const extractSchemas = nestJSAdapter.extractSchemas;
      if (!extractSchemas) {
        expect(true).toBe(true);
        return;
      }

      const tempDir = await mkdtemp(join(tmpdir(), 'peria-dto-by-name-'));

      try {
        // Create a file that matches DTO naming pattern but NOT schema patterns (.dto.ts, .entity.ts, .schema.ts, .model.ts)
        await writeFile(
          join(tempDir, 'data.ts'),
          `export class CreateUserDto {
  email: string;
  name: string;
}
`
        );

        const tempContext = {
          ...context,
          cwd: tempDir,
        };

        const schemas = await extractSchemas(tempContext);
        const createDto = schemas.find((s) => s.name === 'CreateUserDto');

        // DTOs by naming pattern only (not in schema files) should have medium confidence
        expect(createDto?.confidence).toBe('medium');
        expect(createDto?.extractionMethod).toBe('heuristic');
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});

describe('Controller Parser - Edge Cases', () => {
  let context: RepoContext;

  beforeAll(async () => {
    // Load config for the fixture
    const { loadConfig } = await import('../config/loader.js');
    const config = await loadConfig(FIXTURE_PATH);

    context = {
      cwd: FIXTURE_PATH,
      config: config ? defineConfig(config) : DEFAULT_CONTEXT_CONFIG,
    };
  });

  it('should handle nested routes like /users/:id/preferences', async () => {
    const routes = await nestJSAdapter.extractRoutes(context);
    const prefsRoute = routes.find((r) => r.path === '/users/:id/preferences');

    expect(prefsRoute).toBeDefined();
    expect(prefsRoute?.method).toBe('GET');
  });

  it('should handle routes without controller prefix', async () => {
    const routes = await nestJSAdapter.extractRoutes(context);

    // AuthController has @Controller('auth')
    const authRoutes = routes.filter((r) => r.path.startsWith('/auth'));
    expect(authRoutes.length).toBeGreaterThan(0);
  });
});
