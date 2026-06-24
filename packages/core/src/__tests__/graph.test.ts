/**
 * Tests for manifest helpers
 */

import { describe, expect, it } from 'vitest';
import type {
  AgentContextFile,
  DocPageEntity,
  DriftFinding,
  GitChange,
  GraphRelation,
  OpenAPIOperation,
  PackageEntity,
  RouteEntity,
  SchemaEntity,
  SourceFile,
} from '../types/graph.js';
import {
  isValidManifest,
  MANIFEST_VERSION,
  PERIA_VERSION,
  toCompactManifest,
} from '../types/manifest.js';

describe('manifest types', () => {
  it('exports version constants', () => {
    expect(MANIFEST_VERSION).toBe('0.1.0');
    expect(PERIA_VERSION).toBe('0.1.0');
  });

  it('validates manifest structure', () => {
    const validManifest = {
      manifestVersion: '0.1.0',
      periaVersion: '0.1.0',
      generatedAt: '2024-01-01T00:00:00.000Z',
      repo: {
        name: 'test-repo',
        root: '/test',
        commit: 'abc123',
        branch: 'main',
        isDirty: false,
      },
      routes: [] as RouteEntity[],
      schemas: [] as SchemaEntity[],
      openapiOps: [] as OpenAPIOperation[],
      docsPages: [] as DocPageEntity[],
      sourceFiles: [] as SourceFile[],
      packages: [] as PackageEntity[],
      agentContext: [] as AgentContextFile[],
      relations: [] as GraphRelation[],
      git: {
        lastCommit: 'abc123',
        shortCommit: 'abc123',
        branch: 'main',
        isDirty: false,
        changedFiles: [] as string[],
        recentChanges: [] as GitChange[],
      },
      drift: [] as DriftFinding[],
      stats: {
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-01T00:00:01.000Z',
        durationMs: 1000,
        filesScanned: 10,
        packagesScanned: 2,
      },
    };

    expect(isValidManifest(validManifest)).toBe(true);
  });

  it('rejects invalid manifest', () => {
    expect(isValidManifest(null)).toBe(false);
    expect(isValidManifest(undefined)).toBe(false);
    expect(isValidManifest({})).toBe(false);
    expect(isValidManifest({ manifestVersion: '0.1.0' })).toBe(false);
  });

  it('creates compact manifest', () => {
    const manifest = {
      manifestVersion: '0.1.0',
      periaVersion: '0.1.0',
      generatedAt: '2024-01-01T00:00:00.000Z',
      repo: {
        name: 'test-repo',
        root: '/test',
        commit: 'abc123def456',
        branch: 'main',
        isDirty: true,
      },
      routes: [{ id: 'route1' }] as RouteEntity[],
      schemas: [{ id: 'schema1' }] as SchemaEntity[],
      openapiOps: [{ id: 'op1' }] as OpenAPIOperation[],
      docsPages: [{ id: 'doc1' }, { id: 'doc2' }] as DocPageEntity[],
      sourceFiles: [] as SourceFile[],
      packages: [] as PackageEntity[],
      agentContext: [] as AgentContextFile[],
      relations: [{ id: 'rel1' }, { id: 'rel2' }, { id: 'rel3' }] as GraphRelation[],
      git: {
        lastCommit: 'abc123def456',
        shortCommit: 'abc123',
        branch: 'main',
        isDirty: true,
        changedFiles: ['a.ts', 'b.ts'],
        recentChanges: [] as GitChange[],
      },
      drift: [{ id: 'drift1' }, { id: 'drift2' }] as DriftFinding[],
      stats: {
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-01T00:00:01.000Z',
        durationMs: 1000,
        filesScanned: 10,
        packagesScanned: 2,
      },
    };

    const compact = toCompactManifest(manifest);

    expect(compact.manifestVersion).toBe('0.1.0');
    expect(compact.periaVersion).toBe('0.1.0');
    expect(compact.repo.name).toBe('test-repo');
    expect(compact.repo.branch).toBe('main');
    expect(compact.routesCount).toBe(1);
    expect(compact.schemasCount).toBe(1);
    expect(compact.openapiOpsCount).toBe(1);
    expect(compact.docsPagesCount).toBe(2);
    expect(compact.relationsCount).toBe(3);
    expect(compact.driftCount).toBe(2);
    expect(compact.isDirty).toBe(true);
  });
});
