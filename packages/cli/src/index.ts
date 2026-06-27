import { createRequire } from 'node:module';
import CAC from 'cac';
import { buildCommand } from './commands/build.js';
import { checkCommand } from './commands/check.js';
import { contextCommand } from './commands/context.js';
import { diagramCommand } from './commands/diagram.js';
import { initCommand } from './commands/init.js';
import { scanCommand } from './commands/scan.js';
import { serveCommand } from './commands/serve.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const cli = CAC('peria');

// Global options
cli.option('--cwd <path>', 'Working directory', {
  default: process.cwd(),
});

// Commands
cli.command('init', 'Initialize Peria in your project').action(async (opts: { cwd: string }) => {
  await initCommand(opts.cwd);
});

cli.command('build', 'Build documentation').option('--renderer <mode>', 'Renderer mode (static, fumadocs)').action(async (opts: { cwd: string; renderer?: string }) => {
  await buildCommand(opts.cwd, { renderer: opts.renderer as 'static' | 'fumadocs' | undefined });
});

cli.command('serve', 'Serve documentation locally').action(async (opts: { cwd: string }) => {
  await serveCommand(opts.cwd);
});

// Check command with options
cli
  .command('check', 'Run audit checks to detect inconsistencies between code, docs, and OpenAPI')
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
  .command('audit', 'Alias for check')
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

// Context command
cli
  .command('context', 'Generate agent context packs for coding assistants')
  .option('--output <dir>', 'Output directory (default: .peria/context)')
  .action(async (opts: { cwd: string; output?: string }) => {
    await contextCommand(opts.cwd, { output: opts.output });
  });

// Diagram command
cli
  .command('diagram', 'Generate Mermaid diagrams for routes, packages, and schemas')
  .option('--type <type>', 'Diagram type (route-flow, package-deps, schema, all)')
  .option('--output <dir>', 'Output directory (default: .peria/diagrams)')
  .action(async (opts: { cwd: string; type?: string; output?: string }) => {
    await diagramCommand(opts.cwd, {
      type: opts.type as 'route-flow' | 'package-deps' | 'schema' | 'all' | undefined,
      output: opts.output,
    });
  });

// Help
cli.help();

// Version
cli.version(pkg.version);

// Parse
cli.parse();
