/**
 * Context command - Generate agent context packs
 */

import { generateAndSaveContextPacks } from '@peria/core';
import { logger } from '../utils/logger.js';
import { readManifest } from '../utils/manifest.js';

/**
 * CLI options for the context command
 */
interface ContextOptions {
  route?: string;
  package?: string;
  task?: string;
  output?: string;
  watch?: boolean;
}

/**
 * Main context command
 */
export async function contextCommand(cwd: string, options: ContextOptions = {}): Promise<void> {
  logger.header('Peria Context');

  // Load manifest
  const manifest = await readManifest(cwd);
  if (!manifest) {
    logger.error('No manifest found. Run "peria scan" first.');
    process.exit(1);
  }

  const outputDir = options.output ?? '.peria/context';

  // Generate context packs
  logger.info(`Generating context packs to ${outputDir}...`);

  const result = await generateAndSaveContextPacks(manifest, {
    cwd,
    outputDir,
  });

  logger.success(`Generated ${result.totalPacks} context packs:`);
  console.log('');
  console.log(`  Route packs:  ${result.byVariant.route}`);
  console.log(`  Package packs: ${result.byVariant.package}`);
  console.log(`  Task packs:   ${result.byVariant.task}`);
  console.log(`  Diff pack:   ${result.byVariant.diff}`);
  console.log(`  Full pack:   ${result.byVariant.full}`);
  console.log('');

  logger.info(`Context saved to: ${outputDir}`);
  logger.info('Run `peria check` to see drift findings in context.');
}
