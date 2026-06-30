#!/usr/bin/env bun

/**
 * Local package dogfood for the bundled Fumadocs preview app.
 *
 * Packs the current core, renderer, and CLI packages, installs them into a
 * copied fixture, generates docs, then runs `peria serve` from the packed CLI
 * so renderer/app-template packaging issues fail before publish.
 */

import { execFileSync, spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const fixture = join(root, 'packages/core/fixtures/nestjs-basic');
const tempDir = mkdtempSync(join(tmpdir(), 'peria-preview-dogfood-'));
const projectDir = join(tempDir, 'nestjs-basic');
const tarballDir = join(tempDir, 'tarballs');

type RunningProcess = ReturnType<typeof spawn>;

interface ExecFailure {
  stdout?: unknown;
  stderr?: unknown;
}

interface StartedPreview {
  baseUrl: string;
  output: () => string;
  process: RunningProcess;
}

function run(command: string, args: string[], cwd: string): string {
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
      throw new Error(
        [
          `Command failed: ${command} ${args.join(' ')}`,
          formatOutput(error.stdout),
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
    throw new Error(`Expected preview dogfood artifact to exist: ${path}`);
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

function assertTarballContains(tarball: string, expected: string[]): void {
  const entries = run('tar', ['-tf', tarball], root);

  for (const entry of expected) {
    if (!entries.includes(entry)) {
      throw new Error(`Expected ${tarball} to contain ${entry}`);
    }
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
    throw new Error('Could not allocate a local port for preview dogfood.');
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

function startPreview(peria: string, port: number): StartedPreview {
  let output = '';
  const child = spawn(peria, ['--cwd', projectDir, 'serve'], {
    cwd: tempDir,
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      PERIA_PORT: String(port),
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

async function stopProcess(child: RunningProcess): Promise<void> {
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
  const deadline = Date.now() + 60_000;
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

    await delay(500);
  }

  throw new Error(
    [
      `Timed out waiting for ${url}`,
      `Last error: ${lastError}`,
      `Preview output: ${options.appOutput()}`,
    ].join('\n')
  );
}

try {
  console.log(`Preview dogfood temp directory: ${tempDir}`);
  mkdirSync(tarballDir, { recursive: true });

  console.log('Building workspace packages...');
  run('bun', ['run', 'build'], root);

  console.log('Packing local core, renderer, and CLI packages...');
  const coreTarball = packWorkspace('packages/core');
  const rendererTarball = packWorkspace('packages/renderer');
  const cliTarball = packWorkspace('packages/cli');

  assertTarballContains(rendererTarball, [
    'package/app-template/package.json',
    'package/app-template/source.config.ts',
    'package/app-template/src/routes/docs/$.tsx',
    'package/dist/preview.js',
  ]);

  cpSync(fixture, projectDir, { recursive: true });

  console.log('Installing local packed CLI into fixture...');
  run('npm', ['install', '--save-dev', coreTarball, rendererTarball, cliTarball], projectDir);
  console.log(run('npm', ['ls', '@peria/cli', '@peria/renderer', '--depth=0'], projectDir).trim());

  const peria = join(projectDir, 'node_modules/.bin/peria');
  console.log(run(peria, ['--version'], projectDir).trim());

  run(peria, ['scan'], projectDir);
  run(peria, ['build', '--renderer', 'fumadocs'], projectDir);
  run(peria, ['scan'], projectDir);

  assertExists(join(projectDir, 'docs/wiki-manifest.json'));
  assertExists(join(projectDir, 'docs/content/docs/overview.mdx'));
  assertExists(join(projectDir, 'node_modules/@peria/renderer/app-template/package.json'));
  assertExists(join(projectDir, 'node_modules/@peria/renderer/dist/preview.js'));

  const manifest = JSON.parse(readFileSync(join(projectDir, '.peria/manifest.json'), 'utf-8'));
  if (!manifest.routes || manifest.routes.length === 0) {
    throw new Error('Expected preview dogfood fixture scan to detect NestJS routes.');
  }

  const port = await getAvailablePort();
  const preview = startPreview(peria, port);

  try {
    const overviewHtml = await waitForText(`${preview.baseUrl}/docs/overview`, {
      appOutput: preview.output,
    });
    if (!overviewHtml.includes('<html') || overviewHtml.length < 500) {
      throw new Error('Expected /docs/overview to return rendered preview HTML.');
    }

    await waitForText(`${preview.baseUrl}/api/search?query=overview`, {
      appOutput: preview.output,
    });
  } finally {
    await stopProcess(preview.process);
  }

  console.log('Preview app dogfood validation passed.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
