/**
 * Check command - Drift detection and diagnostics
 */

import { exec } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { loadConfig } from '@peria/core';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

/** Features not yet implemented but with descriptive labels */
const STUBBED_FEATURES: Record<string, string> = {
  apiReference: 'OpenAPI parsing',
  contextPacks: 'Agent context packs',
  mermaid: 'Mermaid diagram support',
  embeddedDocsAdapters: 'Framework adapters',
  gitDiff: 'Git diff impact analysis',
  changeMap: 'Semantic change mapping',
  patchNotes: 'Changelog generation',
  github: 'GitHub integration',
};

interface DiagnosticResult {
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

interface CheckResult {
  passed: boolean;
  diagnostics: DiagnosticResult[];
}

/**
 * Runs a git command and returns the trimmed output.
 * @param command - Git command with arguments
 * @param cwd - Working directory
 * @returns Command output trimmed, or null if the command fails
 */
async function git(command: string, cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(command, { cwd });
    return stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Detects uncommitted changes in the working tree.
 * @param cwd - Working directory
 * @returns Warning diagnostic if uncommitted changes exist, null otherwise
 */
async function checkGitStatus(cwd: string): Promise<DiagnosticResult | null> {
  const status = await git('git status --porcelain', cwd);
  if (!status) return null;

  const lines = status.split('\n').filter(Boolean);
  if (lines.length === 0) return null;

  return {
    severity: 'warning',
    message: `${lines.length} uncommitted change(s) detected`,
    details: lines.slice(0, 5).join('\n') + (lines.length > 5 ? '\n... and more' : ''),
  };
}

/**
 * Checks if the manifest exists, is current, and not stale.
 * @param cwd - Working directory
 * @returns Array of diagnostics for manifest state
 */
async function checkManifestFreshness(cwd: string): Promise<DiagnosticResult[]> {
  const diagnostics: DiagnosticResult[] = [];
  const manifestPath = join(cwd, '.eria', 'manifest.json');

  try {
    const manifestStat = await stat(manifestPath);
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    if (!manifest.manifestVersion) {
      diagnostics.push({
        severity: 'warning',
        message: 'Manifest missing version field',
        details: 'Run "peria build" to regenerate',
      });
    }

    const manifestCommit = await git(`git log -1 --format="%H" -- .eria/manifest.json`, cwd);
    const headCommit = await git('git rev-parse HEAD', cwd);

    if (manifestCommit && headCommit && manifestCommit !== headCommit) {
      diagnostics.push({
        severity: 'info',
        message: 'Manifest was generated at a previous commit',
        details: `Manifest commit: ${manifestCommit.slice(0, 7)}, Current HEAD: ${headCommit.slice(0, 7)}`,
      });
    }

    const ageInHours = (Date.now() - manifestStat.mtimeMs) / (1000 * 60 * 60);
    if (ageInHours > 24) {
      diagnostics.push({
        severity: 'info',
        message: `Manifest is ${Math.floor(ageInHours)} hours old`,
        details: 'Consider running "peria build" to update',
      });
    }
  } catch {
    diagnostics.push({
      severity: 'warning',
      message: 'No manifest found',
      details: 'Run "peria build" first to generate',
    });
  }

  return diagnostics;
}

/**
 * Warns about features that are enabled but not yet implemented.
 * @param cwd - Working directory
 * @returns Array of info diagnostics for stubbed features
 */
async function checkStubbedFeatures(cwd: string): Promise<DiagnosticResult[]> {
  const diagnostics: DiagnosticResult[] = [];

  let config: Awaited<ReturnType<typeof loadConfig>>;
  try {
    config = await loadConfig(cwd);
  } catch {
    return diagnostics;
  }

  if (!config?.features) return diagnostics;

  for (const [feature, label] of Object.entries(STUBBED_FEATURES)) {
    if (config.features[feature as keyof typeof config.features]) {
      diagnostics.push({
        severity: 'info',
        message: `${feature} is enabled but not yet implemented`,
        details: `${label} - this feature will be available in a future release`,
      });
    }
  }

  return diagnostics;
}

/**
 * Check package exports alignment
 */
async function checkPackageExports(cwd: string): Promise<DiagnosticResult[]> {
  const diagnostics: DiagnosticResult[] = [];

  // Check if dist exists for packages with exports
  const packagesWithExports = ['@peria/core'];
  for (const pkg of packagesWithExports) {
    const pkgName = pkg.replace('@peria/', 'packages/');
    const distPath = join(cwd, pkgName, 'dist');

    try {
      await stat(distPath);
    } catch {
      diagnostics.push({
        severity: 'error',
        message: `${pkg} dist directory missing`,
        details: 'Run "bun run build" to build packages',
      });
    }
  }

  return diagnostics;
}

/**
 * Main check command
 */
export async function checkCommand(cwd: string): Promise<void> {
  logger.header('Peria Check');

  const result = await runDiagnostics(cwd);

  // Print diagnostics
  for (const diag of result.diagnostics) {
    switch (diag.severity) {
      case 'error':
        logger.error(diag.message);
        break;
      case 'warning':
        logger.warning(diag.message);
        break;
      case 'info':
        logger.info(diag.message);
        break;
    }
    if (diag.details) {
      logger.dim(`  ${diag.details.replace(/\n/g, '\n  ')}`);
    }
  }

  // Summary
  const errors = result.diagnostics.filter((d) => d.severity === 'error').length;
  const warnings = result.diagnostics.filter((d) => d.severity === 'warning').length;
  const infos = result.diagnostics.filter((d) => d.severity === 'info').length;

  console.log();
  if (result.passed) {
    logger.success('Check passed');
    logger.dim(`  ${errors} errors, ${warnings} warnings, ${infos} notes`);
  } else {
    logger.error('Check failed');
    logger.dim(`  ${errors} errors, ${warnings} warnings, ${infos} notes`);
    process.exit(1);
  }
}

/**
 * Run all diagnostics and return combined result
 */
async function runDiagnostics(cwd: string): Promise<CheckResult> {
  const allDiagnostics: DiagnosticResult[] = [];

  // Run all checks in parallel
  const [gitStatus, manifestFreshness, stubbedFeatures, packageExports] = await Promise.all([
    checkGitStatus(cwd),
    checkManifestFreshness(cwd),
    checkStubbedFeatures(cwd),
    checkPackageExports(cwd),
  ]);

  // Collect results
  if (gitStatus) allDiagnostics.push(gitStatus);
  allDiagnostics.push(...manifestFreshness);
  allDiagnostics.push(...stubbedFeatures);
  allDiagnostics.push(...packageExports);

  // Only fail on errors (warnings and infos are informational)
  const passed = !allDiagnostics.some((d) => d.severity === 'error');

  return { passed, diagnostics: allDiagnostics };
}
