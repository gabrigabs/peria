/**
 * GitHub commands.
 *
 * Auth diagnostics intentionally report only token source and remediation steps.
 * Token values are never printed or persisted.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  createDriftIssuesFromFindings,
  createGitHubCacheFromManifest,
  readGitHubCache,
  runAuditChecks,
  syncRoadmapMilestonesFromTasks,
  writeGitHubCache,
} from '@peria/core';
import { logger } from '../utils/logger.js';
import { readManifest } from '../utils/manifest.js';

export type GitHubAuthSource = 'GITHUB_TOKEN' | 'local-config' | 'gh';

export interface GitHubAuthStatus {
  available: boolean;
  source?: GitHubAuthSource;
  localConfigPath: string;
  tried: string[];
}

interface LocalGitHubConfig {
  token?: unknown;
  github?: {
    token?: unknown;
  };
}

interface CreateIssuesFromCheckOptions {
  labels: string[];
  severity?: 'error' | 'warning' | 'info';
  checks?: string[];
}

interface SyncMilestonesFromTasksOptions {
  file: string;
}

export function resolveGitHubAuthStatus(
  cwd: string,
  env: NodeJS.ProcessEnv = process.env
): GitHubAuthStatus {
  const localConfigPath = join(cwd, '.peria', 'github.local.json');
  const tried = ['GITHUB_TOKEN', '.peria/github.local.json', 'gh auth token'];

  if (hasToken(env.GITHUB_TOKEN)) {
    return {
      available: true,
      source: 'GITHUB_TOKEN',
      localConfigPath,
      tried,
    };
  }

  if (readLocalToken(localConfigPath)) {
    return {
      available: true,
      source: 'local-config',
      localConfigPath,
      tried,
    };
  }

  if (readGhToken(cwd)) {
    return {
      available: true,
      source: 'gh',
      localConfigPath,
      tried,
    };
  }

  return {
    available: false,
    localConfigPath,
    tried,
  };
}

export async function githubAuthStatusCommand(cwd: string): Promise<void> {
  const status = resolveGitHubAuthStatus(cwd);

  logger.header('GitHub Auth Status');

  if (status.available && status.source) {
    logger.success(`Credential source: ${describeSource(status.source)}`);
    logger.info('Token value: hidden');
    logger.info('Peria does not write GitHub tokens to manifests, generated docs, or logs.');
    return;
  }

  logger.error('No GitHub credential found.');
  logger.info(`Checked: ${status.tried.join(', ')}`);
  logger.info(
    `Fix: export GITHUB_TOKEN, run "gh auth login", or create ${status.localConfigPath} with {"token":"..."}`
  );
  process.exitCode = 1;
}

export async function githubCommand(args: string[], cwd: string): Promise<void> {
  const [group, action, ...rest] = args;

  if (group === 'auth' && action === 'status' && rest.length === 0) {
    await githubAuthStatusCommand(cwd);
    return;
  }

  if (group === 'auth' && action === 'login' && rest.length === 0) {
    await githubAuthLoginCommand(cwd);
    return;
  }

  if (group === 'cache' && action === 'write' && rest.length === 0) {
    await githubCacheWriteCommand(cwd);
    return;
  }

  if (group === 'issues' && action === 'create-from-check') {
    const options = parseCreateIssuesFromCheckOptions(rest);
    if (!options) {
      process.exitCode = 1;
      return;
    }

    await githubIssuesCreateFromCheckCommand(cwd, options);
    return;
  }

  if (group === 'milestones' && action === 'sync-from-tasks') {
    const options = parseSyncMilestonesFromTasksOptions(rest);
    if (!options) {
      process.exitCode = 1;
      return;
    }

    await githubMilestonesSyncFromTasksCommand(cwd, options);
    return;
  }

  logger.header('GitHub');
  logger.error(`Unknown GitHub command: ${args.join(' ') || '(none)'}`);
  logger.info(
    'Available commands: peria github auth status, peria github auth login, peria github cache write, peria github issues create-from-check, peria github milestones sync-from-tasks'
  );
  process.exitCode = 1;
}

export async function githubAuthLoginCommand(cwd: string): Promise<void> {
  logger.header('GitHub Auth Login');
  logger.info('Delegating to GitHub CLI: gh auth login');

  const result = spawnSync('gh', ['auth', 'login'], {
    cwd,
    stdio: 'inherit',
  });

  if (result.error) {
    logger.error('Could not run "gh auth login". Install GitHub CLI or use GITHUB_TOKEN.');
    process.exitCode = 1;
    return;
  }

  if (result.status !== 0) {
    logger.error(`GitHub CLI login exited with status ${result.status ?? 'unknown'}.`);
    process.exitCode = result.status ?? 1;
    return;
  }

  logger.success('GitHub CLI login completed.');
}

export async function githubCacheWriteCommand(cwd: string): Promise<void> {
  logger.header('GitHub Cache');

  const manifest = await readManifest(cwd);
  if (!manifest) {
    logger.error('Could not find .peria/manifest.json.');
    logger.info('Run "peria scan" before writing the GitHub cache.');
    process.exitCode = 1;
    return;
  }

  const cache = createGitHubCacheFromManifest(manifest);
  const path = await writeGitHubCache(cwd, cache);

  logger.success(`Wrote ${path}`);
  logger.info(
    `Cached ${cache.commits.length} commits, ${cache.pullRequests.length} pull requests, ${cache.issues.length} issues, ${cache.milestones.length} milestones, and ${cache.relations.length} relations.`
  );
}

export async function githubIssuesCreateFromCheckCommand(
  cwd: string,
  options: CreateIssuesFromCheckOptions = { labels: [] }
): Promise<void> {
  logger.header('GitHub Issues From Check');

  const manifest = await readManifest(cwd);
  if (!manifest) {
    logger.error('Could not find .peria/manifest.json.');
    logger.info('Run "peria scan" before creating drift issues.');
    process.exitCode = 1;
    return;
  }

  const auditResult = await runAuditChecks(manifest, {
    cwd,
    minSeverity: options.severity,
    checks: options.checks,
  });
  const findings = auditResult.checks.flatMap((check) => check.findings);
  const existingCache = await readGitHubCache(cwd);
  const result = createDriftIssuesFromFindings(manifest, existingCache, findings, {
    labels: options.labels,
    generatedAt: auditResult.generatedAt,
    reproduceCommand: createReproduceCommand(options),
  });
  const path = await writeGitHubCache(cwd, result.cache);

  logger.success(`Wrote ${path}`);
  logger.info(
    `Processed ${result.findings} findings: ${result.created} created, ${result.updated} updated, ${result.cache.issues.length} total cached issues.`
  );

  if (result.findings === 0) {
    logger.success('No drift findings detected.');
  }
}

export async function githubMilestonesSyncFromTasksCommand(
  cwd: string,
  options: SyncMilestonesFromTasksOptions = { file: 'TASKS.md' }
): Promise<void> {
  logger.header('GitHub Milestones From Tasks');

  const manifest = await readManifest(cwd);
  if (!manifest) {
    logger.error('Could not find .peria/manifest.json.');
    logger.info('Run "peria scan" before syncing roadmap milestones.');
    process.exitCode = 1;
    return;
  }

  const tasksPath = join(cwd, options.file);
  let tasksMarkdown: string;
  try {
    tasksMarkdown = await readFile(tasksPath, 'utf-8');
  } catch {
    logger.error(`Could not read ${options.file}.`);
    logger.info('Pass --file <path> or create TASKS.md in the project root.');
    process.exitCode = 1;
    return;
  }

  const existingCache = await readGitHubCache(cwd);
  const result = syncRoadmapMilestonesFromTasks(manifest, existingCache, tasksMarkdown);
  const path = await writeGitHubCache(cwd, result.cache);

  logger.success(`Wrote ${path}`);
  logger.info(`Synced ${result.milestones} milestones and ${result.issues} roadmap issues.`);
}

function hasToken(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function readLocalToken(path: string): boolean {
  if (!existsSync(path)) {
    return false;
  }

  try {
    const config = JSON.parse(readFileSync(path, 'utf-8')) as LocalGitHubConfig;
    return hasToken(asString(config.token)) || hasToken(asString(config.github?.token));
  } catch {
    return false;
  }
}

function readGhToken(cwd: string): boolean {
  try {
    const token = execFileSync('gh', ['auth', 'token'], {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5_000,
    });

    return hasToken(token);
  } catch {
    return false;
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function describeSource(source: GitHubAuthSource): string {
  switch (source) {
    case 'GITHUB_TOKEN':
      return 'GITHUB_TOKEN environment variable';
    case 'local-config':
      return '.peria/github.local.json';
    case 'gh':
      return 'GitHub CLI (gh auth token)';
  }
}

function parseCreateIssuesFromCheckOptions(args: string[]): CreateIssuesFromCheckOptions | null {
  const options: CreateIssuesFromCheckOptions = {
    labels: [],
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    const value = args[index + 1];

    if (arg === '--label') {
      if (!value) {
        logger.error('Missing value for --label.');
        return null;
      }
      options.labels.push(value);
      index++;
      continue;
    }

    if (arg === '--labels') {
      if (!value) {
        logger.error('Missing value for --labels.');
        return null;
      }
      options.labels.push(...splitList(value));
      index++;
      continue;
    }

    if (arg === '--severity') {
      if (!isSeverity(value)) {
        logger.error('Invalid --severity. Use error, warning, or info.');
        return null;
      }
      options.severity = value;
      index++;
      continue;
    }

    if (arg === '--checks') {
      if (!value) {
        logger.error('Missing value for --checks.');
        return null;
      }
      options.checks = splitList(value);
      index++;
      continue;
    }

    logger.error(`Unknown option for create-from-check: ${arg}`);
    return null;
  }

  options.labels = splitList(options.labels.join(','));
  return options;
}

function parseSyncMilestonesFromTasksOptions(
  args: string[]
): SyncMilestonesFromTasksOptions | null {
  const options: SyncMilestonesFromTasksOptions = {
    file: 'TASKS.md',
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    const value = args[index + 1];

    if (arg === '--file') {
      if (!value) {
        logger.error('Missing value for --file.');
        return null;
      }
      options.file = value;
      index++;
      continue;
    }

    logger.error(`Unknown option for sync-from-tasks: ${arg}`);
    return null;
  }

  return options;
}

function createReproduceCommand(options: CreateIssuesFromCheckOptions): string {
  const parts = ['peria check --json'];

  if (options.severity) {
    parts.push(`--severity ${options.severity}`);
  }

  if (options.checks?.length) {
    parts.push(`--checks ${options.checks.join(',')}`);
  }

  return parts.join(' ');
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isSeverity(value: string | undefined): value is 'error' | 'warning' | 'info' {
  return value === 'error' || value === 'warning' || value === 'info';
}
