/**
 * OpenAPI Matcher Tests
 */

import { describe, expect, it } from 'vitest';
import { matchRoutesToOpenAPI, summarizeMatching } from '../../matcher/index.js';
import type { OpenAPIOperation, RouteEntity } from '../../types/graph.js';

describe('OpenAPI Matcher', () => {
  describe('matchRoutesToOpenAPI', () => {
    it('should match routes with exact path and method', async () => {
      const routes: RouteEntity[] = [
        {
          id: 'route:GET:/users',
          path: '/users',
          method: 'GET',
          handler: {
            id: 'handler:UsersController.getUsers',
            name: 'getUsers',
            file: 'src/users.controller.ts',
            line: 10,
            className: 'UsersController',
          },
          schemas: [],
          source: { file: 'src/users.controller.ts', line: 10 },
          confidence: 'high',
          extractionMethod: 'ast',
        },
      ];

      const operations: OpenAPIOperation[] = [
        {
          id: 'op:getUsers',
          path: '/users',
          method: 'GET',
          operationId: 'getUsers',
          source: { file: 'openapi.yaml' },
          confidence: 'high',
        },
      ];

      const result = await matchRoutesToOpenAPI(routes, operations);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].matchType).toBe('exact');
      expect(result.matches[0].confidence).toBe('high');
      expect(result.stats.exactMatches).toBe(1);
      expect(result.unmatchedRoutes).toHaveLength(0);
    });

    it('should detect unmatched routes', async () => {
      const routes: RouteEntity[] = [
        {
          id: 'route:GET:/users',
          path: '/users',
          method: 'GET',
          schemas: [],
          source: { file: 'src/users.controller.ts', line: 10 },
          confidence: 'high',
          extractionMethod: 'ast',
        },
        {
          id: 'route:POST:/users',
          path: '/users',
          method: 'POST',
          schemas: [],
          source: { file: 'src/users.controller.ts', line: 20 },
          confidence: 'high',
          extractionMethod: 'ast',
        },
      ];

      const operations: OpenAPIOperation[] = [
        {
          id: 'op:getUsers',
          path: '/users',
          method: 'GET',
          operationId: 'getUsers',
          source: { file: 'openapi.yaml' },
          confidence: 'high',
        },
      ];

      const result = await matchRoutesToOpenAPI(routes, operations);

      expect(result.matches).toHaveLength(2);
      expect(result.stats.exactMatches).toBe(1);
      expect(result.stats.unmatchedRoutes).toBe(1);
      expect(result.unmatchedRoutes).toHaveLength(1);
      expect(result.unmatchedRoutes[0].method).toBe('POST');
    });

    it('should detect unmatched operations', async () => {
      const routes: RouteEntity[] = [
        {
          id: 'route:GET:/users',
          path: '/users',
          method: 'GET',
          schemas: [],
          source: { file: 'src/users.controller.ts', line: 10 },
          confidence: 'high',
          extractionMethod: 'ast',
        },
      ];

      const operations: OpenAPIOperation[] = [
        {
          id: 'op:getUsers',
          path: '/users',
          method: 'GET',
          operationId: 'getUsers',
          source: { file: 'openapi.yaml' },
          confidence: 'high',
        },
        {
          id: 'op:createUser',
          path: '/users',
          method: 'POST',
          operationId: 'createUser',
          source: { file: 'openapi.yaml' },
          confidence: 'high',
        },
      ];

      const result = await matchRoutesToOpenAPI(routes, operations);

      expect(result.matches).toHaveLength(1);
      expect(result.stats.exactMatches).toBe(1);
      expect(result.stats.unmatchedOperations).toBe(1);
      expect(result.unmatchedOperations).toHaveLength(1);
      expect(result.unmatchedOperations[0].operationId).toBe('createUser');
    });

    it('should match routes with path parameters', async () => {
      const routes: RouteEntity[] = [
        {
          id: 'route:GET:/users/:id',
          path: '/users/:id',
          method: 'GET',
          handler: {
            id: 'handler:UsersController.getUser',
            name: 'getUser',
            file: 'src/users.controller.ts',
            line: 15,
            className: 'UsersController',
          },
          schemas: [],
          source: { file: 'src/users.controller.ts', line: 15 },
          confidence: 'high',
          extractionMethod: 'ast',
        },
      ];

      const operations: OpenAPIOperation[] = [
        {
          id: 'op:getUser',
          path: '/users/{id}',
          method: 'GET',
          operationId: 'getUser',
          source: { file: 'openapi.yaml' },
          confidence: 'high',
        },
      ];

      const result = await matchRoutesToOpenAPI(routes, operations);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].matchType).toBe('exact');
      expect(result.unmatchedRoutes).toHaveLength(0);
    });

    it('should match routes via operationId', async () => {
      const routes: RouteEntity[] = [
        {
          id: 'route:POST:/users/approve',
          path: '/users/approve',
          method: 'POST',
          handler: {
            id: 'handler:UsersController.approveUser',
            name: 'approveUser',
            file: 'src/users.controller.ts',
            line: 30,
            className: 'UsersController',
          },
          schemas: [],
          source: { file: 'src/users.controller.ts', line: 30 },
          confidence: 'high',
          extractionMethod: 'ast',
        },
      ];

      const operations: OpenAPIOperation[] = [
        {
          id: 'op:approveUser',
          path: '/users/approve',
          method: 'POST',
          operationId: 'approveUser',
          source: { file: 'openapi.yaml' },
          confidence: 'high',
        },
      ];

      const result = await matchRoutesToOpenAPI(routes, operations);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].matchType).toBe('exact');
      expect(result.stats.exactMatches).toBe(1);
    });

    it('should not match routes with different HTTP methods', async () => {
      const routes: RouteEntity[] = [
        {
          id: 'route:POST:/users',
          path: '/users',
          method: 'POST',
          schemas: [],
          source: { file: 'src/users.controller.ts', line: 10 },
          confidence: 'high',
          extractionMethod: 'ast',
        },
      ];

      const operations: OpenAPIOperation[] = [
        {
          id: 'op:getUsers',
          path: '/users',
          method: 'GET',
          operationId: 'getUsers',
          source: { file: 'openapi.yaml' },
          confidence: 'high',
        },
      ];

      const result = await matchRoutesToOpenAPI(routes, operations);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].matchType).toBe('unmatched');
      expect(result.stats.unmatchedRoutes).toBe(1);
    });

    it('should handle empty inputs', async () => {
      const result = await matchRoutesToOpenAPI([], []);

      expect(result.matches).toHaveLength(0);
      expect(result.stats.totalRoutes).toBe(0);
      expect(result.stats.totalOperations).toBe(0);
    });

    it('should provide correct statistics', async () => {
      const routes: RouteEntity[] = [
        {
          id: 'route:GET:/a',
          path: '/a',
          method: 'GET',
          handler: {
            id: 'handler:A',
            name: 'getA',
            file: 'a.ts',
            line: 1,
          },
          schemas: [],
          source: { file: 'a.ts', line: 1 },
          confidence: 'high',
          extractionMethod: 'ast',
        },
        {
          id: 'route:GET:/b',
          path: '/b',
          method: 'GET',
          handler: {
            id: 'handler:B',
            name: 'getB',
            file: 'b.ts',
            line: 1,
          },
          schemas: [],
          source: { file: 'b.ts', line: 1 },
          confidence: 'high',
          extractionMethod: 'ast',
        },
        {
          id: 'route:GET:/c',
          path: '/c',
          method: 'GET',
          handler: {
            id: 'handler:C',
            name: 'getC',
            file: 'c.ts',
            line: 1,
          },
          schemas: [],
          source: { file: 'c.ts', line: 1 },
          confidence: 'high',
          extractionMethod: 'ast',
        },
      ];

      const operations: OpenAPIOperation[] = [
        {
          id: 'op:getA',
          path: '/a',
          method: 'GET',
          operationId: 'getA',
          source: { file: 'openapi.yaml' },
          confidence: 'high',
        },
        {
          id: 'op:getB',
          path: '/b',
          method: 'GET',
          operationId: 'getB',
          source: { file: 'openapi.yaml' },
          confidence: 'high',
        },
        {
          id: 'op:getD',
          path: '/d',
          method: 'GET',
          operationId: 'getD',
          source: { file: 'openapi.yaml' },
          confidence: 'high',
        },
      ];

      const result = await matchRoutesToOpenAPI(routes, operations);

      expect(result.stats.totalRoutes).toBe(3);
      expect(result.stats.totalOperations).toBe(3);
      expect(result.stats.exactMatches).toBe(2);
      expect(result.stats.unmatchedRoutes).toBe(1);
      expect(result.stats.unmatchedOperations).toBe(1);
    });
  });

  describe('summarizeMatching', () => {
    it('should generate a summary string', async () => {
      const routes: RouteEntity[] = [
        {
          id: 'route:GET:/users',
          path: '/users',
          method: 'GET',
          schemas: [],
          source: { file: 'src/users.controller.ts', line: 10 },
          confidence: 'high',
          extractionMethod: 'ast',
        },
        {
          id: 'route:POST:/users',
          path: '/users',
          method: 'POST',
          schemas: [],
          source: { file: 'src/users.controller.ts', line: 20 },
          confidence: 'high',
          extractionMethod: 'ast',
        },
      ];

      const operations: OpenAPIOperation[] = [
        {
          id: 'op:getUsers',
          path: '/users',
          method: 'GET',
          operationId: 'getUsers',
          source: { file: 'openapi.yaml' },
          confidence: 'high',
        },
      ];

      const result = await matchRoutesToOpenAPI(routes, operations);
      const summary = summarizeMatching(result);

      expect(summary).toContain('OpenAPI Matching Results');
      expect(summary).toContain('Routes: 2');
      expect(summary).toContain('Operations: 1');
      expect(summary).toContain('Routes without OpenAPI: 1');
      expect(summary).toContain('POST /users');
    });

    it('should not show unmatched section when everything matches', async () => {
      const routes: RouteEntity[] = [
        {
          id: 'route:GET:/users',
          path: '/users',
          method: 'GET',
          handler: {
            id: 'handler:UsersController',
            name: 'getUsers',
            file: 'src/users.controller.ts',
            line: 10,
            className: 'UsersController',
          },
          schemas: [],
          source: { file: 'src/users.controller.ts', line: 10 },
          confidence: 'high',
          extractionMethod: 'ast',
        },
      ];

      const operations: OpenAPIOperation[] = [
        {
          id: 'op:getUsers',
          path: '/users',
          method: 'GET',
          operationId: 'getUsers',
          source: { file: 'openapi.yaml' },
          confidence: 'high',
        },
      ];

      const result = await matchRoutesToOpenAPI(routes, operations);
      const summary = summarizeMatching(result);

      expect(summary).toContain('Exact: 1');
      expect(summary).not.toContain('without OpenAPI');
      expect(summary).not.toContain('without routes');
    });
  });
});
