/**
 * Peria CLI - Main entry point
 */

import CAC from 'cac';
import { buildCommand } from './commands/build.js';
import { checkCommand } from './commands/check.js';
import { initCommand } from './commands/init.js';
import { scanCommand } from './commands/scan.js';
import { serveCommand } from './commands/serve.js';

const cli = CAC('peria') as {
  option: (name: string, desc: string, opts?: { default?: unknown }) => void;
  command: (
    name: string,
    desc: string
  ) => { action: (fn: (opts: { cwd: string }) => Promise<void>) => void };
  help: () => void;
  version: (v: string) => void;
  parse: () => void;
};

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

cli.command('check', 'Check for documentation drift').action(async (opts: { cwd: string }) => {
  await checkCommand(opts.cwd);
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
