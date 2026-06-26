/**
 * JSON Reporter Tests
 */

import { describe, expect, it } from 'vitest';
import { JSONReporter } from '../../audit/reporters/json.js';
import type { AuditResult } from '../../audit/types.js';

describe('JSON Reporter', () => {
  const reporter = new JSONReporter({ pretty: true });

  it('should format a passed audit result', () => {
    const result: AuditResult = {
      passed: true,
      generatedAt: '2024-01-01T00:00:00.000Z',
      checks: [],
      summary: {
        errors: 0,
        warnings: 0,
        infos: 0,
        total: 0,
      },
    };

    const output = reporter.format(result);

    expect(output).toContain('"passed": true');
    expect(output).toContain('"version": "1.0.0"');
    expect(output).toContain('"summary"');
  });

  it('should format findings correctly', () => {
    const result: AuditResult = {
      passed: false,
      generatedAt: '2024-01-01T00:00:00.000Z',
      checks: [
        {
          name: 'test-check',
          description: 'A test check',
          status: 'failed',
          findings: [
            {
              id: 'finding-1',
              severity: 'error',
              type: 'test-error',
              problem: 'Something went wrong',
              suggestions: ['Fix it'],
              source: { file: 'test.ts', line: 1 },
            },
          ],
        },
      ],
      summary: {
        errors: 1,
        warnings: 0,
        infos: 0,
        total: 1,
      },
    };

    const output = reporter.format(result);
    const parsed = JSON.parse(output);

    expect(parsed.checks[0].findings).toHaveLength(1);
    expect(parsed.checks[0].findings[0].severity).toBe('error');
    expect(parsed.checks[0].findings[0].problem).toBe('Something went wrong');
    expect(parsed.checks[0].findings[0].source.file).toBe('test.ts');
  });

  it('should include check errors in output', () => {
    const result: AuditResult = {
      passed: false,
      generatedAt: '2024-01-01T00:00:00.000Z',
      checks: [
        {
          name: 'failing-check',
          description: 'A failing check',
          status: 'failed',
          findings: [],
          error: 'Something went wrong',
        },
      ],
      summary: {
        errors: 0,
        warnings: 0,
        infos: 0,
        total: 0,
      },
    };

    const output = reporter.format(result);
    const parsed = JSON.parse(output);

    expect(parsed.errors).toBeDefined();
    expect(parsed.errors).toContain('failing-check: Something went wrong');
  });
});
