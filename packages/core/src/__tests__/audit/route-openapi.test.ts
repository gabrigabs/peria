/**
 * Route vs OpenAPI Audit Check Tests
 */

import { describe, it, expect } from 'vitest';
import { runRouteOpenAPICheck } from '../../audit/route-openapi.js';
import type { PeriaManifest } from '../../types/manifest.js';

describe('Route vs OpenAPI Check', () => {
  it('should return empty findings when no routes or operations', async () => {
    const manifest = {
      routes: [],
      openapiOps: [],
    } as unknown as PeriaManifest;

    const findings = await runRouteOpenAPICheck.run(manifest, '/tmp');

    expect(findings).toEqual([]);
  });

  it('should return empty findings when all routes have matching operations', async () => {
    const manifest = {
      routes: [
        {
          id: 'route:GET:/users',
          method: 'GET',
          path: '/users',
          source: { file: 'src/users.ts', line: 1 },
          openapiOp: { id: 'op:GET:/users' },
          schemas: [],
        },
      ],
      openapiOps: [
        {
          id: 'op:GET:/users',
          method: 'GET',
          path: '/users',
          source: { file: 'openapi.yaml', line: 10 },
        },
      ],
    } as unknown as PeriaManifest;

    const findings = await runRouteOpenAPICheck.run(manifest, '/tmp');

    expect(findings).toEqual([]);
  });

  it('should flag routes without OpenAPI operations', async () => {
    const manifest = {
      routes: [
        {
          id: 'route:GET:/users',
          method: 'GET',
          path: '/users',
          source: { file: 'src/users.ts', line: 1 },
          schemas: [],
        },
      ],
      openapiOps: [
        {
          id: 'op:GET:/posts',
          method: 'GET',
          path: '/posts',
          source: { file: 'openapi.yaml', line: 10 },
        },
      ],
    } as unknown as PeriaManifest;

    const findings = await runRouteOpenAPICheck.run(manifest, '/tmp');

    expect(findings).toHaveLength(2);
    expect(findings[0].severity).toBe('error');
    expect(findings[0].type).toBe('route-missing-openapi');
    expect(findings[0].problem).toContain('Route GET /users has no corresponding OpenAPI operation');

    expect(findings[1].severity).toBe('warning');
    expect(findings[1].type).toBe('openapi-missing-route');
  });
});
