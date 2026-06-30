#!/usr/bin/env bun

/**
 * Local package dogfood for the NestJS adapter.
 *
 * Packs the current workspace packages, installs them into a copied NestJS fixture,
 * generates Fumadocs output, starts the compiled Nest app, and validates docs routes
 * through @peria/adapters/nest.
 */

import { execFileSync, spawn } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const fixture = join(root, 'packages/core/fixtures/nestjs-api');
const tempDir = mkdtempSync(join(tmpdir(), 'peria-nest-dogfood-'));
const projectDir = join(tempDir, 'nestjs-api');
const tarballDir = join(tempDir, 'tarballs');

type RunningProcess = ReturnType<typeof spawn>;

interface StartedApp {
  baseUrl: string;
  output: () => string;
  process: RunningProcess;
}

interface CheckResult {
  passed?: boolean;
  checks?: unknown[];
}

interface ExecFailure {
  stdout?: unknown;
  stderr?: unknown;
  message?: unknown;
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
      if (options.allowFailure) {
        return formatOutput(error.stdout);
      }

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
    throw new Error(`Expected dogfood artifact to exist: ${path}`);
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

function patchNestEntrypoint(): void {
  const mainPath = join(projectDir, 'src/main.ts');
  const original = readFileSync(mainPath, 'utf-8');
  let updated = original.replace(
    "import { AppModule } from './app.module.js';",
    [
      "import { AppModule } from './app.module.js';",
      "import { setupPeriaDocs } from '@peria/adapters/nest';",
    ].join('\n')
  );

  updated = updated.replace(
    ['  const app = await NestFactory.create(AppModule);', '  await app.listen(3000);'].join('\n'),
    [
      '  const app = await NestFactory.create(AppModule, { logger: false });',
      "  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api');",
      '  setupPeriaDocs(app, {',
      "    route: process.env.PERIA_DOCS_ROUTE ?? '/docs',",
      "    docsPath: process.env.PERIA_DOCS_PATH ?? 'docs',",
      "    llmsPath: process.env.PERIA_LLMS_PATH ?? 'llms.txt',",
      '  });',
      "  await app.listen(Number(process.env.PORT ?? '3000'), '127.0.0.1');",
    ].join('\n')
  );

  if (updated === original) {
    throw new Error(`Could not patch NestJS entrypoint: ${mainPath}`);
  }

  writeFileSync(mainPath, updated);
}

function validateCheckOutput(output: string): void {
  const result = JSON.parse(output) as CheckResult;

  if (!Array.isArray(result.checks)) {
    throw new Error(`Expected peria check --json to return checks. Received: ${output}`);
  }

  console.log(
    `Validated peria check --json contract. passed=${String(result.passed)} checks=${result.checks.length}`
  );
}

async function getAvailablePort(): Promise<number> {
  const server = createServer();

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not allocate a local port for NestJS dogfood.');
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

function startApp(input: {
  apiPrefix: string;
  docsRoute: string;
  llmsPath?: string;
  port: number;
}): StartedApp {
  let output = '';
  const child = spawn('node', ['dist/main.js'], {
    cwd: projectDir,
    env: {
      ...process.env,
      API_PREFIX: input.apiPrefix,
      FORCE_COLOR: '0',
      PERIA_DOCS_PATH: join(projectDir, 'docs'),
      PERIA_DOCS_ROUTE: input.docsRoute,
      PERIA_LLMS_PATH: input.llmsPath ?? join(projectDir, 'llms.txt'),
      PORT: String(input.port),
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
    baseUrl: `http://127.0.0.1:${input.port}`,
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

async function validateDocsScenario(input: { docsRoute: string; label: string }): Promise<void> {
  const port = await getAvailablePort();
  const app = startApp({
    apiPrefix: 'api',
    docsRoute: input.docsRoute,
    port,
  });

  try {
    await waitForText(`${app.baseUrl}/api/users`, {
      appOutput: app.output,
      includes: '[]',
    });

    await waitForText(`${app.baseUrl}${input.docsRoute}`, {
      appOutput: app.output,
      includes: 'Fumadocs-compatible output',
    });

    const manifestText = await waitForText(`${app.baseUrl}${input.docsRoute}/wiki-manifest.json`, {
      appOutput: app.output,
      includes: '"pages"',
    });
    const manifest = JSON.parse(manifestText) as { pages?: unknown[] };
    if (!Array.isArray(manifest.pages) || manifest.pages.length === 0) {
      throw new Error(`Expected wiki manifest pages for ${input.label}`);
    }

    const llmsText = await waitForText(`${app.baseUrl}${input.docsRoute}/llms.txt`, {
      appOutput: app.output,
    });
    if (llmsText.length < 20) {
      throw new Error(`Expected non-empty llms.txt for ${input.label}`);
    }

    await waitForText(`${app.baseUrl}${input.docsRoute}/content/docs/overview.mdx`, {
      appOutput: app.output,
      includes: '#',
    });

    console.log(`Validated NestJS docs scenario: ${input.label}`);
  } finally {
    await stopApp(app.process);
  }
}

async function validateMissingLlms(): Promise<void> {
  const port = await getAvailablePort();
  const app = startApp({
    apiPrefix: 'api',
    docsRoute: '/docs',
    llmsPath: join(projectDir, 'missing-llms.txt'),
    port,
  });

  try {
    await waitForText(`${app.baseUrl}/docs/llms.txt`, {
      appOutput: app.output,
      includes: 'Run "peria build" first',
      status: 404,
    });
    console.log('Validated missing llms.txt error path.');
  } finally {
    await stopApp(app.process);
  }
}

async function validateUnreadableLlms(): Promise<void> {
  const unreadablePath = join(projectDir, 'unreadable-llms.txt');
  writeFileSync(unreadablePath, '# unreadable\n');
  chmodSync(unreadablePath, 0o000);

  const port = await getAvailablePort();
  const app = startApp({
    apiPrefix: 'api',
    docsRoute: '/docs',
    llmsPath: unreadablePath,
    port,
  });

  try {
    await waitForText(`${app.baseUrl}/docs/llms.txt`, {
      appOutput: app.output,
      includes: 'Run "peria build" first',
      status: 404,
    });
    console.log('Validated unreadable llms.txt error path.');
  } finally {
    await stopApp(app.process);
    chmodSync(unreadablePath, 0o644);
  }
}

function validateMissingDocsError(): void {
  const script = [
    "import express from 'express';",
    "import { setupPeriaDocs } from '@peria/adapters/nest';",
    'const app = { getHttpAdapter() { return { getInstance() { return express(); } }; } };',
    'try {',
    "  setupPeriaDocs(app, { docsPath: './missing-docs' });",
    '} catch (error) {',
    '  const message = error instanceof Error ? error.message : String(error);',
    '  if (message.includes("Peria docs directory does not exist") && message.includes("Run \\"peria build\\"")) {',
    '    process.exit(0);',
    '  }',
    '  console.error(message);',
    '  process.exit(1);',
    '}',
    "console.error('Expected setupPeriaDocs to reject missing docs.');",
    'process.exit(1);',
  ].join('\n');

  run('node', ['--input-type=module', '-e', script], projectDir);
  console.log('Validated missing docs error path.');
}

try {
  console.log(`NestJS dogfood temp directory: ${tempDir}`);
  mkdirSync(tarballDir, { recursive: true });

  console.log('Building workspace packages...');
  run('bun', ['run', 'build'], root);

  console.log('Packing local packages...');
  const tarballs = [
    packWorkspace('packages/core'),
    packWorkspace('packages/renderer'),
    packWorkspace('packages/cli'),
    packWorkspace('packages/adapters'),
  ];

  cpSync(fixture, projectDir, { recursive: true });
  patchNestEntrypoint();

  console.log('Installing local @peria/cli and @peria/adapters into fixture...');
  run('npm', ['install', '--save-dev', ...tarballs], projectDir);
  console.log(run('npm', ['ls', '@peria/cli', '@peria/adapters', '--depth=0'], projectDir).trim());

  const peria = join(projectDir, 'node_modules/.bin/peria');
  console.log(run(peria, ['--version'], projectDir).trim());

  run(peria, ['scan'], projectDir);
  run(peria, ['build', '--renderer', 'fumadocs'], projectDir);
  run(peria, ['scan'], projectDir);
  validateCheckOutput(run(peria, ['check', '--json'], projectDir, { allowFailure: true }));

  assertExists(join(projectDir, '.peria/manifest.json'));
  assertExists(join(projectDir, 'docs/wiki-manifest.json'));
  assertExists(join(projectDir, 'docs/content/docs/overview.mdx'));
  assertExists(join(projectDir, 'llms.txt'));

  run('npm', ['run', 'build'], projectDir);

  await validateDocsScenario({ docsRoute: '/docs', label: 'default /docs with global api prefix' });
  await validateDocsScenario({
    docsRoute: '/internal/docs',
    label: 'subpath /internal/docs with global api prefix',
  });
  await validateMissingLlms();
  await validateUnreadableLlms();
  validateMissingDocsError();

  console.log('NestJS adapter dogfood validation passed.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
