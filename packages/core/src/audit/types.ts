/**
 * Audit Types - Core types for the audit/check system
 *
 * Phase 5: Implements the audit engine that validates code/docs/OpenAPI consistency.
 */

import type { DriftFinding } from '../types/graph.js';
import type { PeriaManifest } from '../types/manifest.js';

/**
 * Severity levels for audit findings
 */
export type AuditSeverity = 'error' | 'warning' | 'info';

/**
 * Check status
 */
export type CheckStatus = 'passed' | 'failed' | 'skipped';

/**
 * Individual audit check definition
 */
export interface AuditCheck {
  /** Unique identifier for the check */
  name: string;
  /** Human-readable description */
  description: string;
  /** Default severity if findings are detected */
  defaultSeverity: AuditSeverity;
  /** Run the check against a manifest */
  run(manifest: PeriaManifest, cwd: string): Promise<DriftFinding[]>;
}

/**
 * Result of a single check
 */
export interface CheckResult {
  name: string;
  description: string;
  status: CheckStatus;
  findings: DriftFinding[];
  error?: string;
}

/**
 * Summary of all audit findings
 */
export interface AuditSummary {
  errors: number;
  warnings: number;
  infos: number;
  total: number;
}

/**
 * Complete audit result
 */
export interface AuditResult {
  passed: boolean;
  generatedAt: string;
  manifestCommit?: string;
  checks: CheckResult[];
  summary: AuditSummary;
}

/**
 * Options for running audit checks
 */
export interface AuditOptions {
  /** Working directory */
  cwd: string;
  /** Filter by severity level */
  minSeverity?: AuditSeverity;
  /** Specific checks to run (default: all) */
  checks?: string[];
  /** Skip checks that already passed last time */
  incremental?: boolean;
}

/**
 * Reporter interface for different output formats
 */
export interface AuditReporter {
  format(result: AuditResult): string;
  formatFinding(finding: DriftFinding): string;
}

/**
 * Create an empty audit result
 */
export function createEmptyAuditResult(): AuditResult {
  return {
    passed: true,
    generatedAt: new Date().toISOString(),
    checks: [],
    summary: {
      errors: 0,
      warnings: 0,
      infos: 0,
      total: 0,
    },
  };
}

/**
 * Calculate summary from check results
 */
export function calculateSummary(checks: CheckResult[]): AuditSummary {
  const summary: AuditSummary = {
    errors: 0,
    warnings: 0,
    infos: 0,
    total: 0,
  };

  for (const check of checks) {
    for (const finding of check.findings) {
      summary.total++;
      switch (finding.severity) {
        case 'error':
          summary.errors++;
          break;
        case 'warning':
          summary.warnings++;
          break;
        case 'info':
          summary.infos++;
          break;
      }
    }
  }

  return summary;
}

/**
 * Filter findings by minimum severity
 */
export function filterBySeverity(
  findings: DriftFinding[],
  minSeverity: AuditSeverity
): DriftFinding[] {
  const levels: Record<AuditSeverity, number> = {
    error: 3,
    warning: 2,
    info: 1,
  };

  const minLevel = levels[minSeverity];
  return findings.filter((f) => levels[f.severity] >= minLevel);
}

/**
 * Sort findings by severity (errors first, then warnings, then info)
 */
export function sortBySeverity(findings: DriftFinding[]): DriftFinding[] {
  const levels: Record<AuditSeverity, number> = {
    error: 3,
    warning: 2,
    info: 1,
  };

  return [...findings].sort((a, b) => levels[b.severity] - levels[a.severity]);
}
