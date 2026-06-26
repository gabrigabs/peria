/**
 * OpenAPI Route Matcher
 *
 * Matches extracted routes from framework adapters (e.g., NestJS) to OpenAPI operations.
 * This creates the critical link between code and documentation.
 */

import type { Confidence, OpenAPIOperation, RouteEntity } from '../types/graph.js';

/**
 * How well a route matches an OpenAPI operation
 */
export type MatchType = 'exact' | 'operationId' | 'fuzzy' | 'unmatched';

/**
 * Result of matching a single route to an OpenAPI operation
 */
export interface RouteOpenAPIMatch {
  routeId: string;
  operationId: string | null;
  matchType: MatchType;
  confidence: Confidence;
  reason: string;
  route: RouteEntity;
  operation?: OpenAPIOperation;
}

/**
 * Result of matching all routes to OpenAPI operations
 */
export interface MatchingResult {
  /** All matches found (route -> operation) */
  matches: RouteOpenAPIMatch[];
  /** Routes that have no corresponding OpenAPI operation */
  unmatchedRoutes: RouteEntity[];
  /** OpenAPI operations that have no corresponding route */
  unmatchedOperations: OpenAPIOperation[];
  /** Statistics */
  stats: {
    totalRoutes: number;
    totalOperations: number;
    exactMatches: number;
    operationIdMatches: number;
    fuzzyMatches: number;
    unmatchedRoutes: number;
    unmatchedOperations: number;
  };
}

/**
 * Normalize a path for comparison
 * Converts /users/:id to /users/{id} (OpenAPI style)
 * Converts /users/{id} to /users/:id (code style)
 */
function normalizePath(path: string): string {
  // Convert :param to {param}
  let normalized = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}');
  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '') || '/';
  // Remove leading slashes for comparison
  return normalized.toLowerCase();
}

/**
 * Check if two paths match (considering parameter names)
 * Returns true if paths have the same structure regardless of param names
 */
function pathsMatch(path1: string, path2: string): { matches: boolean; fuzzy: boolean } {
  const norm1 = normalizePath(path1);
  const norm2 = normalizePath(path2);

  // Exact match
  if (norm1 === norm2) {
    return { matches: true, fuzzy: false };
  }

  // Check if paths have the same structure
  const segments1 = norm1.split('/');
  const segments2 = norm2.split('/');

  if (segments1.length !== segments2.length) {
    return { matches: false, fuzzy: false };
  }

  for (let i = 0; i < segments1.length; i++) {
    const seg1 = segments1[i];
    const seg2 = segments2[i];

    // Both are literals and match
    if (!seg1.startsWith('{') && !seg2.startsWith('{') && seg1 === seg2) {
    }
    // Both are parameters
    else if (seg1.startsWith('{') && seg2.startsWith('{')) {
    }
    // One is parameter, one is literal - structure mismatch
    else {
      return { matches: false, fuzzy: false };
    }
  }

  return { matches: true, fuzzy: true };
}

/**
 * Extract a signature from a path (replacing params with placeholders)
 * e.g., /users/:id/orders/:orderId -> /users/{param}/orders/{param}
 */
function extractPathSignature(path: string): string {
  let signature = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{param}');
  signature = signature.replace(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g, '{param}');
  return signature.toLowerCase();
}

/**
 * Find the best matching OpenAPI operation for a route
 */
function findMatchingOperation(
  route: RouteEntity,
  operations: OpenAPIOperation[]
): RouteOpenAPIMatch | null {
  // First, try exact path + method match
  for (const op of operations) {
    if (op.method !== route.method) continue;

    const { matches, fuzzy } = pathsMatch(route.path, op.path);
    if (matches && !fuzzy) {
      return {
        routeId: route.id,
        operationId: op.operationId || `${op.method} ${op.path}`,
        matchType: 'exact',
        confidence: 'high',
        reason: `Exact path match: ${route.method} ${route.path} -> ${op.operationId || op.path}`,
        route,
        operation: op,
      };
    }
  }

  // Try operationId matching (if route has handler info)
  if (route.handler?.methodName) {
    const handlerName = route.handler.methodName.toLowerCase();
    for (const op of operations) {
      if (op.method !== route.method) continue;
      if (!op.operationId) continue;

      const opIdLower = op.operationId.toLowerCase();
      // Match handler name to operationId
      if (
        opIdLower.includes(handlerName) ||
        handlerName.includes(opIdLower) ||
        opIdLower.replace(/[-_]/g, '') === handlerName.replace(/[-_]/g, '')
      ) {
        return {
          routeId: route.id,
          operationId: op.operationId,
          matchType: 'operationId',
          confidence: 'medium',
          reason: `operationId match: ${route.handler.methodName} -> ${op.operationId}`,
          route,
          operation: op,
        };
      }
    }
  }

  // Try fuzzy path matching (same structure, different param names)
  const routeSignature = extractPathSignature(route.path);
  for (const op of operations) {
    if (op.method !== route.method) continue;

    const opSignature = extractPathSignature(op.path);
    if (routeSignature === opSignature) {
      return {
        routeId: route.id,
        operationId: op.operationId || `${op.method} ${op.path}`,
        matchType: 'fuzzy',
        confidence: 'medium',
        reason: `Fuzzy path match: ${route.path} -> ${op.path} (${route.method})`,
        route,
        operation: op,
      };
    }
  }

  // No match found
  return null;
}

/**
 * Match all routes to OpenAPI operations
 */
export async function matchRoutesToOpenAPI(
  routes: RouteEntity[],
  operations: OpenAPIOperation[]
): Promise<MatchingResult> {
  const matches: RouteOpenAPIMatch[] = [];
  const unmatchedOperations = new Set(operations.map((op) => op.id));

  // Match each route to an operation
  for (const route of routes) {
    const match = findMatchingOperation(route, operations);

    if (match) {
      matches.push(match);
      if (match.operation) {
        unmatchedOperations.delete(match.operation.id);
      }
    } else {
      // Route has no matching operation
      matches.push({
        routeId: route.id,
        operationId: null,
        matchType: 'unmatched',
        confidence: 'low',
        reason: `No OpenAPI operation found for ${route.method} ${route.path}`,
        route,
      });
    }
  }

  // Calculate stats
  const stats = {
    totalRoutes: routes.length,
    totalOperations: operations.length,
    exactMatches: matches.filter((m) => m.matchType === 'exact').length,
    operationIdMatches: matches.filter((m) => m.matchType === 'operationId').length,
    fuzzyMatches: matches.filter((m) => m.matchType === 'fuzzy').length,
    unmatchedRoutes: matches.filter((m) => m.matchType === 'unmatched').length,
    unmatchedOperations: unmatchedOperations.size,
  };

  return {
    matches,
    unmatchedRoutes: matches.filter((m) => m.matchType === 'unmatched').map((m) => m.route),
    unmatchedOperations: operations.filter((op) => unmatchedOperations.has(op.id)),
    stats,
  };
}

/**
 * Get a summary of the matching results
 */
export function summarizeMatching(result: MatchingResult): string {
  const lines: string[] = [];

  lines.push(`OpenAPI Matching Results`);
  lines.push(`========================`);
  lines.push(``);
  lines.push(`Routes: ${result.stats.totalRoutes}`);
  lines.push(`Operations: ${result.stats.totalOperations}`);
  lines.push(``);
  lines.push(`Matches:`);
  lines.push(`  Exact: ${result.stats.exactMatches}`);
  lines.push(`  operationId: ${result.stats.operationIdMatches}`);
  lines.push(`  Fuzzy: ${result.stats.fuzzyMatches}`);
  lines.push(``);

  if (result.stats.unmatchedRoutes > 0) {
    lines.push(`⚠️  Routes without OpenAPI: ${result.stats.unmatchedRoutes}`);
    for (const route of result.unmatchedRoutes) {
      lines.push(`   - ${route.method} ${route.path}`);
    }
    lines.push(``);
  }

  if (result.stats.unmatchedOperations > 0) {
    lines.push(`⚠️  Operations without routes: ${result.stats.unmatchedOperations}`);
    for (const op of result.unmatchedOperations) {
      lines.push(`   - ${op.method} ${op.path} (${op.operationId || 'no operationId'})`);
    }
    lines.push(``);
  }

  return lines.join('\n');
}
