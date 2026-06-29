#!/usr/bin/env bun

/**
 * Validates the public NestJS example with local Peria package tarballs.
 */

import { execFileSync, spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const example = join(root, 'examples/nestjs-api');
const tempDir = mkdtempSync(join(tmpdir(), 'peria-example-nest-'));
const projectDir = join(tempDir, 'nestjs-api');
const tarballDir = join(tempDir, 'tarballs');

type RunningProcess = ReturnType<typeof spawn>;

interface CheckResult {
  passed?: boolean;
  checks?: unknown[];
  summary?: {
    errors?: number;
  };
}

interface ExecFailure {
  stdout?: unknown;
  stderr?: unknown;
}

interface StartedApp {
  baseUrl: string;
  output: () => string;
  process: RunningProcess;
}

function run(
  command: string,
  args: string[],
  cwd: string,
  options: { allowFailure?: boolean } = {}
): string {
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
    if (isExecFailure(error)) {
      const stdout = formatOutput(error.stdout);
      if (options.allowFailure) {
        return stdout;
      }

      throw new Error(
        [
          `Command failed: ${command} ${args.join(' ')}`,
          stdout,
          formatOutput(error.stderr),
        ]
          .filter(Boolean)
          .join('\n')
      );
    }

    throw error;
  }
}

function isExecFailure(error: unknown): error is ExecFailure {
  return typeof error === 'object' && error !== null && ('stdout' in error || 'stderr' in error);
}

function formatOutput(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString('utf-8').trim();
  }

  return '';
}

function assertExists(path: string): void {
  if (!existsSync(path)) {
    throw new Error(`Expected example artifact to exist: ${path}`);
  }
}

function packWorkspace(workspace: string): string {
  const output = run(
    'npm',
    ['pack', '--pack-destination', tarballDir, '--workspace', workspace],
    root
  )
    .trim()
    .split('\n');
  const filename = output.at(-1);

  if (!filename) {
    throw new Error(`npm pack did not return a tarball for ${workspace}`);
  }

  return join(tarballDir, filename);
}

function validateCheckOutput(output: string): void {
  const result = JSON.parse(output) as CheckResult;

  if (!Array.isArray(result.checks)) {
    throw new Error(`Expected peria check --json to return checks. Received: ${output}`);
  }

  if ((result.summary?.errors ?? 0) > 0) {
    throw new Error(`Expected example drift check to have no errors. Received: ${output}`);
  }
}

async function getAvailablePort(): Promise<number> {
  const server = createServer();

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not allocate a local port for NestJS example.');
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  return address.port;
}

function startApp(port: number): StartedApp {
  let output = '';
  const child = spawn('node', ['dist/main.js'], {
    cwd: projectDir,
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk: Buffer) => {
    output += chunk.toString('utf-8');
  });
  child.stderr.on('data', (chunk: Buffer) => {
    output += chunk.toString('utf-8');
  });

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    output: () => output,
    process: child,
  };
}

async function stopApp(child: RunningProcess): Promise<void> {
  if (child.exitCode !== null) {
    return;
  }

  child.kill('SIGTERM');

  await Promise.race([
    new Promise<void>((resolve) => {
      child.once('exit', () => resolve());
    }),
    delay(2_000).then(() => {
      if (child.exitCode === null) {
        child.kill('SIGKILL');
      }
    }),
  ]);
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForText(
  url: string,
  options: { appOutput: () => string; includes?: string; status?: number }
): Promise<string> {
  const expectedStatus = options.status ?? 200;
  const deadline = Date.now() + 15_000;
  let lastError = '';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      const text = await response.text();

      if (
        response.status === expectedStatus &&
        (!options.includes || text.includes(options.includes))
      ) {
        return text;
      }

      lastError = `status=${response.status}; body=${text.slice(0, 300)}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await delay(250);
  }

  throw new Error(
    [
      `Timed out waiting for ${url}`,
      `Last error: ${lastError}`,
      `App output: ${options.appOutput()}`,
    ].join('\n')
  );
}

try {
  console.log(`NestJS example temp directory: ${tempDir}`);
  mkdirSync(tarballDir, { recursive: true });

  console.log('Building workspace packages...');
  run('bun', ['run', 'build'], root);

  console.log('Packing local Peria packages...');
  const tarballs = [
    packWorkspace('packages/core'),
    packWorkspace('packages/renderer'),
    packWorkspace('packages/cli'),
    packWorkspace('packages/adapters'),
  ];

  cpSync(example, projectDir, { recursive: true });

  console.log('Installing example dependencies and local Peria tarballs...');
  run('npm', ['install'], projectDir);
  run('npm', ['install', '--save-dev', ...tarballs], projectDir);

  const peria = join(projectDir, 'node_modules/.bin/peria');
  console.log(run(peria, ['--version'], projectDir).trim());

  run(peria, ['scan'], projectDir);
  run(peria, ['build', '--renderer', 'fumadocs'], projectDir);
  run(peria, ['scan'], projectDir);
  validateCheckOutput(run(peria, ['check', '--json'], projectDir, { allowFailure: true }));

  assertExists(join(projectDir, '.peria/manifest.json'));
  assertExists(join(projectDir, '.peria/application-map.json'));
  assertExists(join(projectDir, 'docs/wiki-manifest.json'));
  assertExists(join(projectDir, 'docs/content/docs/overview.mdx'));
  assertExists(join(projectDir, 'docs/pages/application-map.md'));
  assertExists(join(projectDir, 'llms.txt'));

  const manifest = JSON.parse(readFileSync(join(projectDir, '.peria/manifest.json'), 'utf-8')) as {
    routes?: unknown[];
    schemas?: unknown[];
    openapiOps?: unknown[];
  };

  if ((manifest.routes?.length ?? 0) < 4) {
    throw new Error('Expected NestJS example scan to detect at least 4 routes.');
  }

  if ((manifest.schemas?.length ?? 0) < 1) {
    throw new Error('Expected NestJS example scan to detect schemas.');
  }

  if ((manifest.openapiOps?.length ?? 0) < 4) {
    throw new Error('Expected NestJS example scan to detect OpenAPI operations.');
  }

  run('npm', ['run', 'build'], projectDir);

  const port = await getAvailablePort();
  const app = startApp(port);

  try {
    await waitForText(`${app.baseUrl}/api/users`, {
      appOutput: app.output,
      includes: 'reader@example.com',
    });
    await waitForText(`${app.baseUrl}/docs`, {
      appOutput: app.output,
      includes: 'Fumadocs-compatible output',
    });
    await waitForText(`${app.baseUrl}/docs/wiki-manifest.json`, {
      appOutput: app.output,
      includes: '"pages"',
    });
    await waitForText(`${app.baseUrl}/docs/content/docs/overview.mdx`, {
      appOutput: app.output,
      includes: 'Peria NestJS API Example',
    });
    await waitForText(`${app.baseUrl}/docs/llms.txt`, {
      appOutput: app.output,
      includes: 'Peria NestJS API Example',
    });
  } finally {
    await stopApp(app.process);
  }

  console.log('NestJS example validation passed.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
