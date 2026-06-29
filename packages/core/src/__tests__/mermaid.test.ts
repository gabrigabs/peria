/**
 * Tests for mermaid module
 */

import { describe, expect, it } from 'vitest';
import type { DiagramType } from '../mermaid/index.js';
import {
  DIAGRAM_TYPE_LABELS,
  generateDiagramId,
  generateDiagrams,
  generateModuleGraphDiagrams,
  generatePackageDepDiagrams,
  generateRouteFlowDiagrams,
  generateSchemaDiagrams,
} from '../mermaid/index.js';

describe('mermaid types', () => {
  describe('generateDiagramId', () => {
    it('should generate IDs with prefix', () => {
      const id = generateDiagramId('route-flow');
      expect(id.startsWith('diagram-route-flow-')).toBe(true);
    });

    it('should include type in ID', () => {
      const routeId = generateDiagramId('route-flow');
      const pkgId = generateDiagramId('package-deps');
      const schemaId = generateDiagramId('schema');

      expect(routeId).toContain('diagram-route-flow-');
      expect(pkgId).toContain('diagram-package-deps-');
      expect(schemaId).toContain('diagram-schema-');
    });

    it('should include entity ID when provided', () => {
      const id = generateDiagramId('route-flow', 'users-get');
      expect(id).toContain('users-get');
    });

    it('should sanitize entity IDs', () => {
      const id = generateDiagramId('schema', 'User Profile');
      expect(id).not.toContain(' ');
    });

    it('should generate deterministic IDs', () => {
      const first = generateDiagramId('schema', 'User Profile');
      const second = generateDiagramId('schema', 'User Profile');

      expect(first).toBe(second);
    });
  });

  describe('DIAGRAM_TYPE_LABELS', () => {
    it('should have labels for all diagram types', () => {
      const types: DiagramType[] = [
        'route-flow',
        'module-graph',
        'package-deps',
        'schema',
        'endpoint-handler',
      ];

      for (const type of types) {
        expect(DIAGRAM_TYPE_LABELS[type]).toBeDefined();
        expect(typeof DIAGRAM_TYPE_LABELS[type]).toBe('string');
        expect(DIAGRAM_TYPE_LABELS[type].length).toBeGreaterThan(0);
      }
    });

    it('should have human-readable labels', () => {
      expect(DIAGRAM_TYPE_LABELS['route-flow']).toBe('Route Flow');
      expect(DIAGRAM_TYPE_LABELS['module-graph']).toBe('Module Graph');
      expect(DIAGRAM_TYPE_LABELS['package-deps']).toBe('Package Dependencies');
      expect(DIAGRAM_TYPE_LABELS.schema).toBe('Schema Diagram');
      expect(DIAGRAM_TYPE_LABELS['endpoint-handler']).toBe('Endpoint Handler');
    });
  });

  describe('generators', () => {
    it('should export generateRouteFlowDiagrams', () => {
      expect(typeof generateRouteFlowDiagrams).toBe('function');
    });

    it('should export generatePackageDepDiagrams', () => {
      expect(typeof generatePackageDepDiagrams).toBe('function');
    });

    it('should export generateModuleGraphDiagrams', () => {
      expect(typeof generateModuleGraphDiagrams).toBe('function');
    });

    it('should export generateSchemaDiagrams', () => {
      expect(typeof generateSchemaDiagrams).toBe('function');
    });

    it('should export generateDiagrams', () => {
      expect(typeof generateDiagrams).toBe('function');
    });
  });
});
