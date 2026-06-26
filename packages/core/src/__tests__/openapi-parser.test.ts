/**
 * Tests for OpenAPI parser
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { parseOpenAPI, parseOpenAPIDetailed } from '../parsers/openapi.js';

const FIXTURES_DIR = join(import.meta.dirname, '..', '..', 'fixtures');

beforeAll(async () => {
  try {
    await mkdir(FIXTURES_DIR, { recursive: true });
  } catch {
    // Ignore
  }
});

describe('parseOpenAPI', () => {
  it('parses OpenAPI 3.x YAML spec', async () => {
    const spec = `openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      operationId: listUsers
      responses:
        '200':
          description: Success
`;

    const fixturePath = join(FIXTURES_DIR, 'test-openapi.yaml');
    await writeFile(fixturePath, spec);

    const result = await parseOpenAPI(fixturePath);

    expect(result.id.startsWith('openapi:')).toBe(true);
    expect(result.type).toBe('openapi');
    expect(result.version).toBe('3.0.0');
    expect((result.metadata as { title?: string }).title).toBe('Test API');
  });

  it('parses OpenAPI JSON spec', async () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'JSON API', version: '1.0.0' },
      paths: {},
    });

    const fixturePath = join(FIXTURES_DIR, 'test-openapi.json');
    await writeFile(fixturePath, spec);

    const result = await parseOpenAPI(fixturePath);

    expect((result.metadata as { title?: string }).title).toBe('JSON API');
    expect((result.metadata as { format?: string }).format).toBe('json');
  });

  it('extracts endpoints', async () => {
    const spec = `openapi: 3.0.0
info:
  title: Test
  version: 1.0.0
paths:
  /posts:
    get:
      operationId: listPosts
    post:
      operationId: createPost
`;

    const fixturePath = join(FIXTURES_DIR, 'test-endpoints.yaml');
    await writeFile(fixturePath, spec);

    const result = await parseOpenAPI(fixturePath);

    expect((result.endpoints ?? []).length).toBe(2);
  });
});

describe('parseOpenAPIDetailed', () => {
  it('extracts operation information', async () => {
    const spec = `openapi: 3.0.0
info:
  title: Test
  version: 1.0.0
paths:
  /users:
    post:
      operationId: createUser
      summary: Create a user
      responses:
        '201':
          description: Created
`;

    const fixturePath = join(FIXTURES_DIR, 'test-detailed.yaml');
    await writeFile(fixturePath, spec);

    const result = await parseOpenAPIDetailed(fixturePath);

    expect(result.operations.length).toBe(1);
    expect(result.operations[0].operationId).toBe('createUser');
  });

  it('extracts parameters', async () => {
    const spec = `openapi: 3.0.0
info:
  title: Test
  version: 1.0.0
paths:
  /users/{id}:
    get:
      operationId: getUser
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: OK
`;

    const fixturePath = join(FIXTURES_DIR, 'test-params.yaml');
    await writeFile(fixturePath, spec);

    const result = await parseOpenAPIDetailed(fixturePath);

    expect(result.operations[0].parameters?.length).toBe(1);
    expect(result.operations[0].parameters?.[0].name).toBe('id');
  });
});
