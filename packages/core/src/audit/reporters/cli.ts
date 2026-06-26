/**
 * CLI Reporter - Human-readable audit output
 */

import type { AuditResult } from '../types.js';
import type { DriftFinding } from '../../types/graph.js';

/**
 * Format a source reference
 */
function formatSource(source: DriftFinding['source']): string {
  const parts: string[] = [];

  if (source.file) {
    parts.push(source.file);
  }

  if (source.line) {
    parts.push(`:${source.line}`);
  }

  return parts.join('');
}

/**
 * Format a suggestion
 */
function formatSuggestion(suggestion: string, index: number): string {
  return `  ${String.fromCharCode(97 + index)}) ${suggestion}`;
}

/**
 * CLI Reporter for audit output
 */
export class CLIReporter {
  private showSuggestions: boolean;
  private color: boolean;

  constructor(options?: { showSuggestions?: boolean; color?: boolean }) {
    this.showSuggestions = options?.showSuggestions ?? true;
    this.color = options?.color ?? true;
  }

  /**
   * Format the complete audit result
   */
  format(result: AuditResult): string {
    const lines: string[] = [];

    // Header
    lines.push(this.color ? '\x1b[1mPeria Audit Report\x1b[0m' : 'Peria Audit Report');
    lines.push(this.color ? '\x1b[2m' + '='.repeat(50) + '\x1b[0m' : '='.repeat(50));
    lines.push('');

    if (result.checks.length === 0) {
      lines.push('No checks were run.');
      lines.push('');
      return lines.join('\n');
    }

    // Group findings by severity
    const errors: DriftFinding[] = [];
    const warnings: DriftFinding[] = [];
    const infos: DriftFinding[] = [];

    for (const check of result.checks) {
      for (const finding of check.findings) {
        switch (finding.severity) {
          case 'error':
            errors.push(finding);
            break;
          case 'warning':
            warnings.push(finding);
            break;
          case 'info':
            infos.push(finding);
            break;
        }
      }
    }

    // Errors section
    if (errors.length > 0) {
      lines.push(this.color ? '\x1b[31m[ERROR]\x1b[0m' : '[ERROR]');
      lines.push('');
      for (const finding of errors) {
        lines.push(...this.formatFinding(finding));
        lines.push('');
      }
    }

    // Warnings section
    if (warnings.length > 0) {
      lines.push(this.color ? '\x1b[33m[WARNING]\x1b[0m' : '[WARNING]');
      lines.push('');
      for (const finding of warnings) {
        lines.push(...this.formatFinding(finding));
        lines.push('');
      }
    }

    // Info section
    if (infos.length > 0) {
      lines.push(this.color ? '\x1b[36m[INFO]\x1b[0m' : '[INFO]');
      lines.push('');
      for (const finding of infos) {
        lines.push(...this.formatFinding(finding));
        lines.push('');
      }
    }

    // Summary
    lines.push(this.color ? '\x1b[2m---\x1b[0m' : '---');
    lines.push('');
    lines.push(`Summary: ${this.formatSummary(result.summary)}`);

    // Status
    lines.push('');
    if (result.passed) {
      lines.push(this.color ? '\x1b[32m✓ Status: PASSED\x1b[0m' : '✓ Status: PASSED');
    } else {
      lines.push(this.color ? '\x1b[31m✗ Status: FAILED\x1b[0m' : '✗ Status: FAILED');
    }

    // Check details
    lines.push('');
    lines.push(this.color ? '\x1b[2mChecks:\x1b[0m' : 'Checks:');
    for (const check of result.checks) {
      const icon = check.status === 'passed' ? '✓' : '✗';
      const iconColor = check.status === 'passed' ? '\x1b[32m' : '\x1b[31m';
      const checkLine = `${check.status === 'passed' ? iconColor : ''}${icon} ${check.name}${check.status === 'passed' ? '\x1b[0m' : ''}`;
      lines.push(this.color ? checkLine : `${icon} ${check.name}`);
    }

    return lines.join('\n');
  }

  /**
   * Format a single finding
   */
  private formatFinding(finding: DriftFinding): string[] {
    const lines: string[] = [];

    // Problem
    lines.push(`  • ${finding.problem}`);

    // Source
    const source = formatSource(finding.source);
    if (source) {
      lines.push(this.color ? `    \x1b[90m→ ${source}\x1b[0m` : `    → ${source}`);
    }

    // Entity
    if (finding.entityId) {
      lines.push(this.color ? `    \x1b[90mEntity: ${finding.entityId}\x1b[0m` : `    Entity: ${finding.entityId}`);
    }

    // Suggestions
    if (this.showSuggestions && finding.suggestions.length > 0) {
      lines.push('    Suggestions:');
      for (let i = 0; i < Math.min(finding.suggestions.length, 3); i++) {
        lines.push(formatSuggestion(finding.suggestions[i], i));
      }
      if (finding.suggestions.length > 3) {
        lines.push(`    ... and ${finding.suggestions.length - 3} more`);
      }
    }

    return lines;
  }

  /**
   * Format the summary
   */
  private formatSummary(summary: AuditResult['summary']): string {
    const parts: string[] = [];

    if (summary.errors > 0) {
      const errorText = `${summary.errors} error${summary.errors === 1 ? '' : 's'}`;
      parts.push(this.color ? `\x1b[31m${errorText}\x1b[0m` : errorText);
    }

    if (summary.warnings > 0) {
      const warningText = `${summary.warnings} warning${summary.warnings === 1 ? '' : 's'}`;
      parts.push(this.color ? `\x1b[33m${warningText}\x1b[0m` : warningText);
    }

    if (summary.infos > 0) {
      const infoText = `${summary.infos} note${summary.infos === 1 ? '' : 's'}`;
      parts.push(this.color ? `\x1b[36m${infoText}\x1b[0m` : infoText);
    }

    if (parts.length === 0) {
      return '0 issues';
    }

    return parts.join(', ');
  }
}

/**
 * Create a CLI reporter instance
 */
export function createCLIReporter(options?: { showSuggestions?: boolean; color?: boolean }): CLIReporter {
  return new CLIReporter(options);
}
