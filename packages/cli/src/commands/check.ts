/**
 * Check command - Audit/drift detection and diagnostics
 */

import { CLIReporter, runAuditChecks, toJSON } from '@peria/core';
import { logger } from '../utils/logger.js';
import { readManifest } from '../utils/manifest.js';

/**
 * CLI options for the check command
 */
interface CheckOptions {
  json?: boolean;
  severity?: 'error' | 'warning' | 'info';
  checks?: string[];
}

/**
 * Main check command
 */
export async function checkCommand(cwd: string, options: CheckOptions = {}): Promise<void> {
  if (!options.json) {
    logger.header('Peria Check');
  }

  // Load manifest
  const manifest = await readManifest(cwd);
  if (!manifest) {
    logger.error('No manifest found. Run "peria scan" first.');
    process.exitCode = 1;
    return;
  }

  // Run audit checks
  const auditResult = await runAuditChecks(manifest, {
    cwd,
    minSeverity: options.severity,
    checks: options.checks,
  });

  // Output
  if (options.json) {
    console.log(toJSON(auditResult));
  } else {
    const reporter = new CLIReporter({ color: true, showSuggestions: true });
    console.log(reporter.format(auditResult));
  }

  // Exit code based on result
  if (!auditResult.passed) {
    process.exitCode = 1;
  }
}
