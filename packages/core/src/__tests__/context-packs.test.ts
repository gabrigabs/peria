/**
 * Tests for context packs module
 */

import { describe, expect, it } from 'vitest';
import { generateContextPackId, TASK_TEMPLATES } from '../context-packs/index.js';

describe('context-packs types', () => {
  describe('generateContextPackId', () => {
    it('should generate IDs with prefix', () => {
      const id = generateContextPackId('route');
      expect(id.startsWith('ctx-route-')).toBe(true);
    });

    it('should include variant in ID', () => {
      const routeId = generateContextPackId('route');
      const pkgId = generateContextPackId('package');
      const taskId = generateContextPackId('task');

      expect(routeId).toContain('ctx-route-');
      expect(pkgId).toContain('ctx-package-');
      expect(taskId).toContain('ctx-task-');
    });

    it('should include entity ID when provided', () => {
      const id = generateContextPackId('route', 'users-get');
      expect(id).toContain('users-get');
    });

    it('should sanitize entity IDs', () => {
      const id = generateContextPackId('route', 'users/profile (v2)');
      expect(id).not.toContain(' ');
      expect(id).not.toContain('(');
    });
  });

  describe('TASK_TEMPLATES', () => {
    it('should have add-route template', () => {
      expect(TASK_TEMPLATES['add-route']).toBeDefined();
      expect(TASK_TEMPLATES['add-route'].title).toBe('Add new route');
      expect(TASK_TEMPLATES['add-route'].instructions.length).toBeGreaterThan(0);
    });

    it('should have add-schema template', () => {
      expect(TASK_TEMPLATES['add-schema']).toBeDefined();
      expect(TASK_TEMPLATES['add-schema'].title).toBe('Add new schema');
    });

    it('should have add-package template', () => {
      expect(TASK_TEMPLATES['add-package']).toBeDefined();
      expect(TASK_TEMPLATES['add-package'].title).toBe('Add new package');
    });

    it('should have fix-drift template', () => {
      expect(TASK_TEMPLATES['fix-drift']).toBeDefined();
      expect(TASK_TEMPLATES['fix-drift'].title).toBe('Fix documentation drift');
    });

    it('should have non-empty instructions for all templates', () => {
      for (const template of Object.values(TASK_TEMPLATES)) {
        expect(template.instructions.length).toBeGreaterThan(0);
      }
    });
  });
});
