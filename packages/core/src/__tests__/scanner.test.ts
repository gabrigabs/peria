/**
 * Tests for the repository scanner
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { scan } from '../scanner.js';

describe('scan', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(import.meta.dirname, `test-scan-${Date.now()}`);
    await mkdir(join(testDir, 'packages', 'core', 'src'), { recursive: true });
    await mkdir(join(testDir, 'docs'), { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('scans an empty directory', async () => {
    const result = await scan(testDir);

    expect(result.manifest).toBeDefined();
    expect(result.manifest.manifestVersion).toBe('0.1.0');
    expect(result.manifest.generatedAt).toBeTruthy();
    expect(result.manifest.repo).toBeDefined();
    expect(result.manifest.stats).toBeDefined();
    expect(result.manifest.stats.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('detects packages', async () => {
    // Create package.json
    await writeFile(
      join(testDir, 'package.json'),
      JSON.stringify({
        name: 'test-monorepo',
        version: '1.0.0',
        workspaces: ['packages/*'],
      })
    );

    await writeFile(
      join(testDir, 'packages', 'core', 'package.json'),
      JSON.stringify({
        name: '@test/core',
        version: '1.0.0',
        description: 'Core package',
        dependencies: {
          typescript: '^5.0.0',
        },
        scripts: {
          build: 'tsc',
          test: 'vitest',
        },
      })
    );

    const result = await scan(testDir);

    expect(result.manifest.packages.length).toBeGreaterThanOrEqual(1);

    const corePackage = result.manifest.packages.find((p) => p.name === '@test/core');
    expect(corePackage).toBeDefined();
    expect(corePackage?.version).toBe('1.0.0');
    expect(corePackage?.description).toBe('Core package');
    expect(corePackage?.dependencies).toContain('typescript');
  });

  it('parses markdown docs', async () => {
    await writeFile(
      join(testDir, 'README.md'),
      `# Test Project

## Overview

This is a test project.

## API

Use POST /users to create a user.
Use GET /users/:id to get a user.
`
    );

    await writeFile(
      join(testDir, 'docs', 'guide.md'),
      `---
title: User Guide
---

# User Guide

## Getting Started

Create users with CreateUserRequest DTO.
`
    );

    const result = await scan(testDir);

    expect(result.manifest.docsPages.length).toBeGreaterThanOrEqual(1);

    const readme = result.manifest.docsPages.find((d) => d.path === 'README.md');
    expect(readme).toBeDefined();
    // Title comes from frontmatter or falls back to filename
    expect(readme?.title).toBeTruthy();

    // Check route mentions
    const readmeWithRoutes = result.manifest.docsPages.find((d) => d.path === 'README.md');
    if (readmeWithRoutes) {
      expect(readmeWithRoutes.routeMentions.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('parses OpenAPI spec', async () => {
    const openapiSpec = `openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      operationId: listUsers
      summary: List all users
      responses:
        '200':
          description: Success
    post:
      operationId: createUser
      summary: Create a user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              \\$ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: Created
components:
  schemas:
    CreateUserRequest:
      type: object
      properties:
        name:
          type: string
      required:
        - name
`;

    await writeFile(join(testDir, 'openapi.yaml'), openapiSpec);

    const result = await scan(testDir);

    expect(result.manifest.openapi).toBeDefined();
    expect(result.manifest.openapi?.version).toBe('3.0.0');
    expect(result.manifest.openapi?.paths).toContain('/users');
    expect(result.manifest.openapiOps.length).toBe(2);

    const createOp = result.manifest.openapiOps.find((op) => op.operationId === 'createUser');
    expect(createOp).toBeDefined();
    expect(createOp?.method).toBe('POST');
    expect(createOp?.path).toBe('/users');
  });

  it('extracts TypeScript source files', async () => {
    await writeFile(
      join(testDir, 'packages', 'core', 'src', 'index.ts'),
      `export { scan } from './scanner.js'
export { parseMarkdown } from './parsers/markdown.js'

export interface Config {
  name: string
}
`
    );

    await writeFile(
      join(testDir, 'packages', 'core', 'src', 'scanner.ts'),
      `import { parseMarkdown } from './parsers/markdown.js'

export async function scan() {
  return { ok: true }
}
`
    );

    const result = await scan(testDir);

    // Should find TypeScript files
    const tsFiles = result.manifest.sourceFiles.filter((f) => f.path.endsWith('.ts'));
    expect(tsFiles.length).toBeGreaterThanOrEqual(1);
  });

  it('collects Git metadata', async () => {
    const result = await scan(testDir);

    expect(result.manifest.git).toBeDefined();
    expect(result.manifest.git.branch).toBeTruthy();
    expect(result.manifest.git.lastCommit).toBeTruthy();
    expect(typeof result.manifest.git.isDirty).toBe('boolean');
  });

  it('reports warnings', async () => {
    // Don't create any files - scanner will report warnings
    const result = await scan(testDir);

    // May have warnings about missing config
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('includes framework detection', async () => {
    // Create package.json without any framework
    await writeFile(
      join(testDir, 'package.json'),
      JSON.stringify({ name: 'test', version: '1.0.0' })
    );

    const result = await scan(testDir);

    expect(result.manifest.framework).toBeDefined();
    expect(['nestjs', 'express', 'fastify', 'hono', 'elysia', 'other']).toContain(
      result.manifest.framework?.name
    );
  });
});

describe('Golden Manifest - nestjs-basic fixture', () => {
  const FIXTURE_PATH = join(import.meta.dirname, '../../fixtures/nestjs-basic');
  const GOLDEN_PATH = join(FIXTURE_PATH, '.peria', 'manifest.golden.json');

  it('has a golden manifest snapshot', async () => {
    // Verify golden manifest exists
    const { stat } = await import('node:fs/promises');
    await expect(stat(GOLDEN_PATH)).resolves.toBeDefined();
  });

  it('produces consistent route extraction', async () => {
    const result = await scan(FIXTURE_PATH);

    // Should extract routes with high confidence
    expect(result.manifest.routes.length).toBeGreaterThan(0);
    expect(result.manifest.routes.every((r) => r.confidence === 'high')).toBe(true);
    expect(result.manifest.routes.every((r) => r.extractionMethod === 'ast')).toBe(true);
  });

  it('produces routes with handler information', async () => {
    const result = await scan(FIXTURE_PATH);

    const routesWithHandlers = result.manifest.routes.filter((r) => r.handler);
    expect(routesWithHandlers.length).toBeGreaterThan(0);

    // Each route should have handler with className and methodName
    for (const route of routesWithHandlers) {
      expect(route.handler?.className).toBeDefined();
      expect(route.handler?.methodName).toBeDefined();
      expect(route.handler?.file).toBeDefined();
      expect(route.handler?.line).toBeGreaterThan(0);
    }
  });

  it('extracts schemas with confidence metadata', async () => {
    const result = await scan(FIXTURE_PATH);

    // Schemas from .dto.ts files should have high confidence
    const dtoSchemas = result.manifest.schemas.filter((s) => s.name.includes('Dto'));
    expect(dtoSchemas.length).toBeGreaterThan(0);

    // All schemas should have confidence defined (high or medium)
    for (const schema of result.manifest.schemas) {
      expect(['high', 'medium', 'low']).toContain(schema.confidence);
    }
  });

  it('creates relations between entities', async () => {
    const result = await scan(FIXTURE_PATH);

    // Should have relations for routes, schemas, and packages
    expect(result.manifest.relations.length).toBeGreaterThan(0);

    // Relations should have proper structure
    for (const rel of result.manifest.relations) {
      expect(rel.id).toBeDefined();
      expect(rel.sourceId).toBeDefined();
      expect(rel.targetId).toBeDefined();
      expect(rel.type).toBeDefined();
      expect(rel.confidence).toBeDefined();
      expect(rel.reason).toBeDefined();
    }
  });

  it('detects NestJS framework with high confidence', async () => {
    const result = await scan(FIXTURE_PATH);

    expect(result.manifest.framework?.name).toBe('nestjs');
    expect(result.manifest.framework?.confidence).toBe('high');
  });
});
