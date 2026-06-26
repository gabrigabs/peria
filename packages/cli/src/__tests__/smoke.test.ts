/**
 * CLI Smoke Tests
 *
 * Basic tests to verify CLI commands are exported correctly.
 */

import { describe, expect, it } from 'vitest';

describe('CLI commands', () => {
  describe('scan command', () => {
    it('should export scanCommand function', async () => {
      const { scanCommand } = await import('../commands/scan.js');
      expect(typeof scanCommand).toBe('function');
    });

    it('should have correct function signature', async () => {
      const { scanCommand } = await import('../commands/scan.js');
      // scanCommand takes cwd: string and returns Promise<void>
      expect(scanCommand.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('build command', () => {
    it('should export buildCommand function', async () => {
      const { buildCommand } = await import('../commands/build.js');
      expect(typeof buildCommand).toBe('function');
    });

    it('should have correct function signature', async () => {
      const { buildCommand } = await import('../commands/build.js');
      // buildCommand takes cwd: string and returns Promise<void>
      expect(buildCommand.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('check command', () => {
    it('should export checkCommand function', async () => {
      const { checkCommand } = await import('../commands/check.js');
      expect(typeof checkCommand).toBe('function');
    });

    it('should have correct function signature', async () => {
      const { checkCommand } = await import('../commands/check.js');
      // checkCommand takes cwd: string and options: CheckOptions and returns Promise<void>
      expect(checkCommand.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('context command', () => {
    it('should export contextCommand function', async () => {
      const { contextCommand } = await import('../commands/context.js');
      expect(typeof contextCommand).toBe('function');
    });

    it('should have correct function signature', async () => {
      const { contextCommand } = await import('../commands/context.js');
      expect(contextCommand.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('diagram command', () => {
    it('should export diagramCommand function', async () => {
      const { diagramCommand } = await import('../commands/diagram.js');
      expect(typeof diagramCommand).toBe('function');
    });

    it('should have correct function signature', async () => {
      const { diagramCommand } = await import('../commands/diagram.js');
      expect(diagramCommand.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('CLI utilities', () => {
  describe('logger', () => {
    it('should export logger with required methods', async () => {
      const { logger } = await import('../utils/logger.js');
      expect(typeof logger.header).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.success).toBe('function');
      expect(typeof logger.warning).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.dim).toBe('function');
    });
  });

  describe('manifest utils', () => {
    it('should export readManifest function', async () => {
      const { readManifest } = await import('../utils/manifest.js');
      expect(typeof readManifest).toBe('function');
    });
  });
});
