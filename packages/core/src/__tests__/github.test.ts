/**
 * GitHub cache tests
 */

import { describe, expect, it } from 'vitest';
import { createGitHubCacheFromManifest } from '../github/index.js';
import type {
  DriftFinding,
  GraphRelation,
  OpenAPIOperation,
  PackageEntity,
  RouteEntity,
  SchemaEntity,
  SourceFile,
} from '../types/graph.js';
import type { PeriaManifest } from '../types/manifest.js';

describe('github cache', () => {
  it('creates GitHub relations from manifest git changes and issue metadata', () => {
    const manifest = createManifest();
    const cache = createGitHubCacheFromManifest(manifest, {
      generatedAt: '2026-06-29T00:00:00.000Z',
      issues: [
        {
          id: 'issue:34',
          number: 34,
          title: 'Document users route drift',
          state: 'closed',
          labels: ['peria:drift'],
          milestoneNumber: 1,
          driftFindingId: 'drift:users-docs',
        },
      ],
      milestones: [
        {
          id: 'milestone:1',
          number: 1,
          title: 'Milestone 1',
          state: 'closed',
        },
      ],
    });

    expect(cache.cacheVersion).toBe('0.1.0');
    expect(cache.commits).toHaveLength(1);
    expect(cache.pullRequests[0]?.number).toBe(12);
    expect(cache.issues[0]?.number).toBe(34);
    expect(cache.relations.map((relation) => relation.type)).toEqual(
      expect.arrayContaining([
        'entity_changed_by_commit',
        'commit_belongs_to_pr',
        'pr_fixes_issue',
        'issue_belongs_to_milestone',
        'drift_finding_opens_issue',
      ])
    );
  });
});

function createManifest(): PeriaManifest {
  return {
    manifestVersion: '0.1.0',
    periaVersion: '0.1.0',
    generatedAt: '2026-06-29T00:00:00.000Z',
    repo: {
      name: 'example-api',
      root: '/repo',
      commit: 'abcdef1234567890',
      branch: 'main',
      isDirty: false,
    },
    routes: [
      {
        id: 'route:GET:/users',
        path: '/users',
        method: 'GET',
        schemas: [],
        source: { file: 'src/users.controller.ts', line: 10 },
        confidence: 'high',
        extractionMethod: 'ast',
      },
    ] as RouteEntity[],
    schemas: [
      {
        id: 'schema:UserDto',
        name: 'UserDto',
        type: 'response',
        file: 'src/users.controller.ts',
        line: 4,
      },
    ] as SchemaEntity[],
    openapiOps: [] as OpenAPIOperation[],
    docsPages: [],
    sourceFiles: [
      {
        id: 'source:src/users.controller.ts',
        path: 'src/users.controller.ts',
        source: { file: 'src/users.controller.ts' },
        confidence: 'high',
      },
    ] as SourceFile[],
    packages: [] as PackageEntity[],
    agentContext: [],
    relations: [] as GraphRelation[],
    git: {
      lastCommit: 'abcdef1234567890',
      shortCommit: 'abcdef1',
      branch: 'main',
      isDirty: false,
      changedFiles: [],
      recentChanges: [
        {
          id: 'abcdef1234567890:src/users.controller.ts',
          path: 'src/users.controller.ts',
          type: 'modified',
          status: 'M',
          commit: 'abcdef1234567890',
          author: 'Peria',
          date: '2026-06-29T00:00:00.000Z',
          subject: 'fix(users): update route docs (#12) fixes #34',
        },
      ],
    },
    drift: [
      {
        id: 'drift:users-docs',
        severity: 'warning',
        type: 'route-docs',
        entityId: 'route:GET:/users',
        entityType: 'route',
        problem: 'Route docs are stale.',
        source: { file: 'docs/users.md', line: 1 },
        suggestions: ['Update docs/users.md'],
      },
    ] as DriftFinding[],
    stats: {
      startTime: '2026-06-29T00:00:00.000Z',
      endTime: '2026-06-29T00:00:01.000Z',
      durationMs: 1_000,
      filesScanned: 1,
      packagesScanned: 0,
    },
  };
}
