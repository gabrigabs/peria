/**
 * Audit Module - Main entry point
 *
 * Phase 5: Implements the audit engine that validates code/docs/OpenAPI consistency.
 *
 * @example
 * ```ts
 * import { runAuditChecks } from '@peria/core';
 *
 * const result = await runAuditChecks(manifest, { cwd: process.cwd() });
 * console.log(result.passed); // true if no errors
 * ```
 */

export * from './docs-routes.js';
export * from './git-diff.js';
export * from './manifest-state.js';
export * from './openapi-docs.js';
export * from './package-exports.js';
export * from './reporters/cli.js';
export * from './reporters/json.js';
export * from './route-openapi.js';
export * from './routes-undocumented.js';
export * from './schema-coverage.js';
export * from './stale-openapi.js';
export * from './stale-pages.js';
export * from './types.js';

import type { PeriaManifest } from '../types/manifest.js';
import { runDocsRoutesCheck } from './docs-routes.js';
import { runGitDiffCheck } from './git-diff.js';
import { runManifestStateCheck } from './manifest-state.js';
import { runOpenAPIDocsCheck } from './openapi-docs.js';
import { runPackageExportsCheck } from './package-exports.js';
import { runRouteOpenAPICheck } from './route-openapi.js';
import { runRoutesUndocumentedCheck } from './routes-undocumented.js';
import { runSchemaCoverageCheck } from './schema-coverage.js';
import { runStaleOpenAPICheck } from './stale-openapi.js';
import { runStalePagesCheck } from './stale-pages.js';
import type { AuditCheck, AuditOptions, AuditResult, CheckResult, CheckStatus } from './types.js';
import { calculateSummary, createEmptyAuditResult } from './types.js';

/**
 * All available audit checks
 */
export const AUDIT_CHECKS: AuditCheck[] = [
  runRouteOpenAPICheck,
  runDocsRoutesCheck,
  runManifestStateCheck,
  runPackageExportsCheck,
  runStalePagesCheck,
  runStaleOpenAPICheck,
  runGitDiffCheck,
  runSchemaCoverageCheck,
  runOpenAPIDocsCheck,
  runRoutesUndocumentedCheck,
];

/**
 * Run all audit checks against a manifest
 */
export async function runAuditChecks(
  manifest: PeriaManifest,
  options: AuditOptions
): Promise<AuditResult> {
  const result = createEmptyAuditResult();
  result.manifestCommit = manifest.git?.lastCommit;

  // Filter checks to run
  const checksToRun = options.checks
    ? AUDIT_CHECKS.filter((c) => options.checks?.includes(c.name))
    : AUDIT_CHECKS;

  // Run all checks in parallel for performance
  const checkResults: CheckResult[] = await Promise.all(
    checksToRun.map(async (check) => {
      try {
        const findings = await check.run(manifest, options.cwd);

        // Filter by severity if specified
        let filteredFindings = findings;
        if (options.minSeverity) {
          const levels = { error: 3, warning: 2, info: 1 };
          const minLevel = levels[options.minSeverity];
          filteredFindings = findings.filter(
            (f) => levels[f.severity as keyof typeof levels] >= minLevel
          );
        }

        const hasErrorFinding = filteredFindings.some((finding) => finding.severity === 'error');

        return {
          name: check.name,
          description: check.description,
          status: (hasErrorFinding ? 'failed' : 'passed') as CheckStatus,
          findings: filteredFindings,
        };
      } catch (error) {
        return {
          name: check.name,
          description: check.description,
          status: 'failed' as CheckStatus,
          findings: [],
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  result.checks = checkResults;
  result.summary = calculateSummary(checkResults);

  // Check passes only when there are no error findings and no check crashed.
  result.passed = result.summary.errors === 0 && !checkResults.some((check) => check.error);

  return result;
}

/**
 * Get a specific audit check by name
 */
export function getAuditCheck(name: string): AuditCheck | undefined {
  return AUDIT_CHECKS.find((check) => check.name === name);
}

/**
 * List all available audit check names
 */
export function listAuditChecks(): { name: string; description: string }[] {
  return AUDIT_CHECKS.map((check) => ({
    name: check.name,
    description: check.description,
  }));
}
