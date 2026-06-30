/**
 * Schema Coverage Audit Check Tests
 */

import { describe, expect, it } from 'vitest';
import { runSchemaCoverageCheck } from '../../audit/schema-coverage.js';
import type { PeriaManifest } from '../../types/manifest.js';

describe('Schema Coverage Check', () => {
  it('normalizes OpenAPI schema references and route parameter schemas', async () => {
    const manifest = {
      routes: [
        {
          id: 'route:POST:/users/:id/approve',
          method: 'POST',
          path: '/users/:id/approve',
          source: { file: 'src/users.controller.ts', line: 10 },
          schemas: [
            {
              id: 'param:UsersController.approveUser:id',
              name: 'id',
              type: 'path',
            },
            {
              id: 'param:UsersController.approveUser:body',
              name: 'body',
              type: 'body',
            },
          ],
        },
      ],
      openapiOps: [
        {
          id: 'op:approveUser',
          method: 'POST',
          path: '/users/{id}/approve',
          source: { file: 'openapi.yaml', line: 10 },
          requestBody: { schema: 'ApproveUserRequest' },
          responses: [{ statusCode: '200', schema: 'User' }],
        },
      ],
      schemas: [
        {
          id: 'schema:ApproveUserRequest',
          name: 'ApproveUserRequest',
          type: 'request',
        },
        {
          id: 'schema:User',
          name: 'User',
          type: 'response',
        },
      ],
    } as unknown as PeriaManifest;

    const findings = await runSchemaCoverageCheck.run(manifest, '/tmp');

    expect(findings.filter((finding) => finding.type === 'schema-undefined')).toEqual([]);
  });
});
