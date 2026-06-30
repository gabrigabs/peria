#!/usr/bin/env bun

/**
 * Fresh npm dogfood validation for the published CLI.
 *
 * This intentionally installs @peria/cli@latest outside the workspace, then
 * runs it against a copied fixture so workspace links cannot hide packaging
 * problems.
 */

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const fixture = join(root, 'packages/core/fixtures/nestjs-basic');
const tempDir = mkdtempSync(join(tmpdir(), 'peria-dogfood-'));
const projectDir = join(tempDir, 'nestjs-basic');

function run(command: string, args: string[], cwd: string, allowFailure = false): string {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        FORCE_COLOR: '0',
      },
    });
  } catch (error) {
    if (allowFailure && typeof error === 'object' && error && 'stdout' in error) {
      return String((error as { stdout?: unknown }).stdout ?? '');
    }

    throw error;
  }
}

function assertExists(path: string): void {
  if (!existsSync(path)) {
    throw new Error(`Expected dogfood artifact to exist: ${path}`);
  }
}

try {
  console.log(`Dogfood temp directory: ${tempDir}`);
  cpSync(fixture, projectDir, { recursive: true });

  run('npm', ['init', '-y'], tempDir);
  run('npm', ['install', '--save-dev', '@peria/cli@latest', '--prefer-online'], tempDir);

  const peria = join(tempDir, 'node_modules/.bin/peria');
  const version = run(peria, ['--version'], tempDir).trim();
  console.log(`Installed ${version}`);

  run(peria, ['--cwd', projectDir, 'scan'], tempDir);
  run(peria, ['--cwd', projectDir, 'build'], tempDir);
  run(peria, ['--cwd', projectDir, 'scan'], tempDir);

  const checkOutput = run(peria, ['--cwd', projectDir, 'check', '--json'], tempDir, true);
  const checkResult = JSON.parse(checkOutput);

  if (!Array.isArray(checkResult.checks)) {
    throw new Error('Expected peria check --json to return a checks array.');
  }

  assertExists(join(projectDir, '.peria/manifest.json'));
  assertExists(join(projectDir, 'docs/wiki-manifest.json'));
  assertExists(join(projectDir, 'llms.txt'));

  const hasFumadocsOutput = existsSync(join(projectDir, 'docs/content/docs/overview.mdx'));
  const hasStaticOutput = existsSync(join(projectDir, 'docs/index.html'));

  if (!hasFumadocsOutput && !hasStaticOutput) {
    throw new Error(
      'Expected either Fumadocs MDX output or the currently published static output.'
    );
  }

  const manifest = JSON.parse(readFileSync(join(projectDir, '.peria/manifest.json'), 'utf-8'));
  if (!manifest.routes || manifest.routes.length === 0) {
    throw new Error('Expected dogfood fixture scan to detect NestJS routes.');
  }

  console.log('Dogfood npm validation passed.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
