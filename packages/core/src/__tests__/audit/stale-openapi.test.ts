/**
 * Stale OpenAPI Audit Check Tests
 */

import { describe, expect, it } from 'vitest';
import { runStaleOpenAPICheck } from '../../audit/stale-openapi.js';
import type { PeriaManifest } from '../../types/manifest.js';

describe('Stale OpenAPI Check', () => {
  it('does not require enriched OpenAPI when the manifest has no enriched path', async () => {
    const manifest = {
      openapi: {
        path: 'openapi.yaml',
        operationsCount: 1,
      },
    } as unknown as PeriaManifest;

    const findings = await runStaleOpenAPICheck.run(manifest, '/tmp');

    expect(findings).toEqual([]);
  });
});
