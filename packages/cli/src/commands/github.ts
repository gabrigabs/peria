/**
 * GitHub commands.
 *
 * Auth diagnostics intentionally report only token source and remediation steps.
 * Token values are never printed or persisted.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from '../utils/logger.js';

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

  logger.header('GitHub');
  logger.error(`Unknown GitHub command: ${args.join(' ') || '(none)'}`);
  logger.info('Available commands: peria github auth status, peria github auth login');
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
