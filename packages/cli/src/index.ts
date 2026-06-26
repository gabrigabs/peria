/**
 * Peria CLI - Main entry point
 */

import CAC from 'cac';
import { buildCommand } from './commands/build.js';
import { checkCommand } from './commands/check.js';
import { initCommand } from './commands/init.js';
import { scanCommand } from './commands/scan.js';
import { serveCommand } from './commands/serve.js';

const cli = CAC('peria');

// Global options
cli.option('--cwd <path>', 'Working directory', {
  default: process.cwd(),
});

// Commands
cli.command('init', 'Initialize Peria in your project').action(async (opts: { cwd: string }) => {
  await initCommand(opts.cwd);
});

cli.command('build', 'Build documentation').action(async (opts: { cwd: string }) => {
  await buildCommand(opts.cwd);
});

cli.command('serve', 'Serve documentation locally').action(async (opts: { cwd: string }) => {
  await serveCommand(opts.cwd);
});

// Check command with options
cli
  .command('check [options]', 'Run audit checks to detect inconsistencies between code, docs, and OpenAPI')
  .option('--json', 'Output results as JSON')
  .option('--severity <level>', 'Minimum severity to report (error, warning, info)')
  .option('--checks <names>', 'Comma-separated list of checks to run')
  .action(async (opts: { cwd: string; json?: boolean; severity?: string; checks?: string }) => {
    await checkCommand(opts.cwd, {
      json: opts.json,
      severity: opts.severity as 'error' | 'warning' | 'info' | undefined,
      checks: opts.checks ? opts.checks.split(',').map((s) => s.trim()) : undefined,
    });
  });

// Alias 'audit' for 'check'
cli
  .command('audit [options]', 'Alias for check')
  .option('--json', 'Output results as JSON')
  .option('--severity <level>', 'Minimum severity to report (error, warning, info)')
  .option('--checks <names>', 'Comma-separated list of checks to run')
  .action(async (opts: { cwd: string; json?: boolean; severity?: string; checks?: string }) => {
    await checkCommand(opts.cwd, {
      json: opts.json,
      severity: opts.severity as 'error' | 'warning' | 'info' | undefined,
      checks: opts.checks ? opts.checks.split(',').map((s) => s.trim()) : undefined,
    });
  });

cli
  .command('scan', 'Scan repository and generate manifest')
  .action(async (opts: { cwd: string }) => {
    await scanCommand(opts.cwd);
  });

// Help
cli.help();

// Version
cli.version('0.1.0');

// Parse
cli.parse();
