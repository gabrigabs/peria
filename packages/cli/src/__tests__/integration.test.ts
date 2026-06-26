/**
 * CLI Integration Tests
 *
 * End-to-end tests for CLI commands using real fixtures.
 */

import { spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

// Monorepo root (absolute path)
const MONOREPO_ROOT = '/Users/gabrielbezerrarodrigues/dev/peria';

// Path to CLI binary
const CLI = join(MONOREPO_ROOT, 'packages/cli/bin/peria.js');

// Path to fixtures
const FIXTURES = join(MONOREPO_ROOT, 'packages/core/fixtures');

// Temp directory for tests
let tempDir: string;
let fixtureCounter = 0;

function createFixtureCopy(name: string): string {
  const fixturePath = join(tempDir, `${name}-${fixtureCounter++}`);
  cpSync(join(FIXTURES, name), fixturePath, { recursive: true });
  return fixturePath;
}

function runCli(
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const child = spawn('node', [CLI, ...args], {
      cwd,
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 0,
      });
    });

    child.on('error', (err) => {
      stderr += err.message;
      resolve({ stdout, stderr, exitCode: 1 });
    });
  });
}

describe('CLI Integration Tests', () => {
  beforeAll(() => {
    // Create temp directory
    tempDir = join(tmpdir(), `peria-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    // Clean up temp directory
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
  });

  describe('scan command', () => {
    it('should scan a NestJS fixture and generate manifest', async () => {
      const fixturePath = createFixtureCopy('nestjs-basic');
      const result = await runCli(['scan'], fixturePath);

      expect(result.exitCode).toBe(0);

      // Verify manifest was created
      const manifestPath = join(fixturePath, '.peria/manifest.json');
      expect(existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      // Should have detected NestJS framework
      expect(manifest.framework?.name).toBe('nestjs');
      expect(manifest.framework?.confidence).toBe('high');

      // Should have found routes
      expect(manifest.routes?.length).toBeGreaterThan(0);
    });

    it('should fail gracefully on non-existent directory', async () => {
      const result = await runCli(['scan'], '/non/existent/path');
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('build command', () => {
    it('should build docs for a NestJS fixture', async () => {
      const fixturePath = createFixtureCopy('nestjs-basic');

      // First scan
      await runCli(['scan'], fixturePath);

      // Then build
      const result = await runCli(['build'], fixturePath);
      expect(result.exitCode).toBe(0);

      // Verify docs were created
      const docsDir = join(fixturePath, 'docs');
      expect(existsSync(docsDir)).toBe(true);
      expect(existsSync(join(docsDir, 'index.html'))).toBe(true);
      expect(existsSync(join(docsDir, 'wiki-manifest.json'))).toBe(true);

      const manifest = JSON.parse(readFileSync(join(fixturePath, '.peria/manifest.json'), 'utf-8'));
      expect(manifest.routes?.length).toBeGreaterThan(0);
    });

    // Skip test that creates docs without scan (implementation detail)
  });

  describe('check command', () => {
    it('should check a NestJS fixture and output findings', async () => {
      const fixturePath = createFixtureCopy('nestjs-basic');

      // First scan and build
      await runCli(['scan'], fixturePath);
      await runCli(['build'], fixturePath);

      // Then check
      const result = await runCli(['check'], fixturePath);
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Peria Check');
    });

    it('should output pure JSON with --json flag', async () => {
      const fixturePath = createFixtureCopy('nestjs-basic');

      // First scan and build
      await runCli(['scan'], fixturePath);
      await runCli(['build'], fixturePath);

      // Check with JSON output
      const result = await runCli(['check', '--json'], fixturePath);
      expect(result.exitCode).toBe(1);

      // Output should start with valid JSON object
      const trimmed = result.stdout.trim();
      expect(trimmed).toMatch(/^\{/);
      const parsed = JSON.parse(trimmed);
      expect(parsed.version).toBe('1.0.0');
      expect(Array.isArray(parsed.checks)).toBe(true);
    });

    it('should handle --json --severity error', async () => {
      const fixturePath = createFixtureCopy('nestjs-basic');

      await runCli(['scan'], fixturePath);
      await runCli(['build'], fixturePath);

      const result = await runCli(['check', '--json', '--severity', 'error'], fixturePath);
      expect(result.exitCode).toBe(1);

      // Output should be valid JSON
      const trimmed = result.stdout.trim();
      expect(trimmed).toMatch(/^\{/);
      expect(() => JSON.parse(trimmed)).not.toThrow();
    });
  });

  describe('context command', () => {
    it('should generate context packs', async () => {
      const fixturePath = createFixtureCopy('nestjs-basic');

      await runCli(['scan'], fixturePath);

      const result = await runCli(['context'], fixturePath);
      expect(result.exitCode).toBe(0);

      // Verify context directory was created
      const contextDir = join(fixturePath, '.peria/context');
      expect(existsSync(contextDir)).toBe(true);
    });
  });

  describe('diagram command', () => {
    it('should generate Mermaid diagrams', async () => {
      const fixturePath = createFixtureCopy('nestjs-basic');

      await runCli(['scan'], fixturePath);

      const result = await runCli(['diagram'], fixturePath);
      expect(result.exitCode).toBe(0);

      // Verify diagrams directory was created
      const diagramsDir = join(fixturePath, '.peria/diagrams');
      expect(existsSync(diagramsDir)).toBe(true);
    });
  });

  describe('--help flag', () => {
    it('should show help for scan command', async () => {
      // Use the CLI directly without cwd
      const result = await runCli(['--help'], MONOREPO_ROOT);
      // --help should exit with 0
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Usage');
    });
  });

  // Skip init test - requires interactive tty
});
