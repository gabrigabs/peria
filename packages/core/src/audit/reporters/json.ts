/**
 * JSON Reporter - Machine-readable audit output
 */

import type { DriftFinding } from '../../types/graph.js';
import type { AuditResult } from '../types.js';

/**
 * JSON output format for audit results
 */
export interface AuditJSONOutput {
  version: string;
  passed: boolean;
  generatedAt: string;
  manifestCommit?: string;
  summary: {
    errors: number;
    warnings: number;
    infos: number;
    total: number;
  };
  checks: {
    name: string;
    description: string;
    status: 'passed' | 'failed' | 'skipped';
    findings: AuditJSONFinding[];
  }[];
  errors?: string[];
}

/**
 * JSON format for individual findings
 */
export interface AuditJSONFinding {
  id: string;
  severity: 'error' | 'warning' | 'info';
  type: string;
  entityId?: string;
  entityType?: string;
  problem: string;
  expected?: string;
  actual?: string;
  source: {
    file?: string;
    line?: number;
    column?: number;
    commit?: string;
    url?: string;
  };
  suggestions: string[];
  relatedEntities?: string[];
}

/**
 * JSON Reporter for audit output
 */
export class JSONReporter {
  private pretty: boolean;

  constructor(options?: { pretty?: boolean }) {
    this.pretty = options?.pretty ?? true;
  }

  /**
   * Format the complete audit result as JSON
   */
  format(result: AuditResult): string {
    const output: AuditJSONOutput = {
      version: '1.0.0',
      passed: result.passed,
      generatedAt: result.generatedAt,
      manifestCommit: result.manifestCommit,
      summary: result.summary,
      checks: result.checks.map((check) => ({
        name: check.name,
        description: check.description,
        status: check.status,
        findings: check.findings.map((f) => this.formatFinding(f)),
      })),
    };

    // Add any errors from checks
    const errors = result.checks.filter((c) => c.error).map((c) => `${c.name}: ${c.error}`);

    if (errors.length > 0) {
      output.errors = errors;
    }

    return this.pretty ? JSON.stringify(output, null, 2) : JSON.stringify(output);
  }

  /**
   * Format a single finding
   */
  private formatFinding(finding: DriftFinding): AuditJSONFinding {
    return {
      id: finding.id,
      severity: finding.severity,
      type: finding.type,
      entityId: finding.entityId,
      entityType: finding.entityType,
      problem: finding.problem,
      expected: finding.expected,
      actual: finding.actual,
      source: {
        file: finding.source.file,
        line: finding.source.line,
        column: finding.source.column,
        commit: finding.source.commit,
        url: finding.source.url,
      },
      suggestions: finding.suggestions,
      relatedEntities: finding.relatedEntities,
    };
  }

  /**
   * Parse JSON output back to AuditResult
   * (useful for testing or further processing)
   */
  parse(json: string): AuditJSONOutput {
    return JSON.parse(json);
  }
}

/**
 * Create a JSON reporter instance
 */
export function createJSONReporter(options?: { pretty?: boolean }): JSONReporter {
  return new JSONReporter(options);
}

/**
 * Format audit result as JSON (convenience function)
 */
export function toJSON(result: AuditResult, options?: { pretty?: boolean }): string {
  const reporter = createJSONReporter(options);
  return reporter.format(result);
}
