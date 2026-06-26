/**
 * Audit Module Tests
 */

import { describe, expect, it } from 'vitest';
import {
  calculateSummary,
  createEmptyAuditResult,
  filterBySeverity,
  sortBySeverity,
} from '../../audit/types.js';
import type { DriftFinding } from '../../types/graph.js';

describe('Audit Types', () => {
  describe('createEmptyAuditResult', () => {
    it('should create an empty audit result', () => {
      const result = createEmptyAuditResult();

      expect(result.passed).toBe(true);
      expect(result.generatedAt).toBeDefined();
      expect(result.checks).toEqual([]);
      expect(result.summary).toEqual({
        errors: 0,
        warnings: 0,
        infos: 0,
        total: 0,
      });
    });
  });

  describe('calculateSummary', () => {
    it('should calculate summary from check results', () => {
      const checks = [
        {
          name: 'check1',
          description: 'Test check',
          status: 'failed' as const,
          findings: [
            { severity: 'error' } as DriftFinding,
            { severity: 'warning' } as DriftFinding,
          ],
        },
        {
          name: 'check2',
          description: 'Test check 2',
          status: 'passed' as const,
          findings: [{ severity: 'info' } as DriftFinding, { severity: 'info' } as DriftFinding],
        },
      ];

      const summary = calculateSummary(checks);

      expect(summary).toEqual({
        errors: 1,
        warnings: 1,
        infos: 2,
        total: 4,
      });
    });

    it('should handle empty check results', () => {
      const summary = calculateSummary([]);

      expect(summary).toEqual({
        errors: 0,
        warnings: 0,
        infos: 0,
        total: 0,
      });
    });
  });

  describe('filterBySeverity', () => {
    const findings: DriftFinding[] = [
      { severity: 'error' } as DriftFinding,
      { severity: 'warning' } as DriftFinding,
      { severity: 'info' } as DriftFinding,
    ];

    it('should filter by error severity', () => {
      const filtered = filterBySeverity(findings, 'error');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].severity).toBe('error');
    });

    it('should filter by warning severity', () => {
      const filtered = filterBySeverity(findings, 'warning');
      expect(filtered).toHaveLength(2);
      expect(filtered.map((f) => f.severity)).toContain('error');
      expect(filtered.map((f) => f.severity)).toContain('warning');
    });

    it('should include all findings with info severity', () => {
      const filtered = filterBySeverity(findings, 'info');
      expect(filtered).toHaveLength(3);
    });
  });

  describe('sortBySeverity', () => {
    it('should sort findings by severity (errors first)', () => {
      const findings: DriftFinding[] = [
        { severity: 'info' } as DriftFinding,
        { severity: 'error' } as DriftFinding,
        { severity: 'warning' } as DriftFinding,
      ];

      const sorted = sortBySeverity(findings);

      expect(sorted[0].severity).toBe('error');
      expect(sorted[1].severity).toBe('warning');
      expect(sorted[2].severity).toBe('info');
    });
  });
});
