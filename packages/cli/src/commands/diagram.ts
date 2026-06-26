/**
 * Diagram command - Generate Mermaid diagrams
 */

import { readManifest } from '../utils/manifest.js';
import { generateAndSaveDiagrams } from '@peria/core';
import { logger } from '../utils/logger.js';

/**
 * CLI options for the diagram command
 */
interface DiagramOptions {
  type?: 'route-flow' | 'package-deps' | 'schema' | 'all';
  output?: string;
  watch?: boolean;
}

/**
 * Main diagram command
 */
export async function diagramCommand(cwd: string, options: DiagramOptions = {}): Promise<void> {
  logger.header('Peria Diagrams');

  // Load manifest
  const manifest = await readManifest(cwd);
  if (!manifest) {
    logger.error('No manifest found. Run "peria scan" first.');
    process.exit(1);
  }

  const outputDir = options.output ?? '.peria/diagrams';

  // Determine diagram types
  const defaultTypes = ['route-flow', 'package-deps', 'schema'] as const;
  const types = options.type && options.type !== 'all'
    ? [options.type as 'route-flow' | 'package-deps' | 'schema']
    : [...defaultTypes];

  // Generate diagrams
  logger.info(`Generating diagrams to ${outputDir}...`);

  const result = await generateAndSaveDiagrams(manifest, {
    cwd,
    outputDir,
    types,
  });

  logger.success(`Generated ${result.metadata.totalDiagrams} diagrams:`);
  console.log('');
  console.log(`  Route flow diagrams:  ${result.metadata.byType['route-flow']}`);
  console.log(`  Package dep diagrams: ${result.metadata.byType['package-deps']}`);
  console.log(`  Schema diagrams:     ${result.metadata.byType['schema']}`);
  console.log('');

  logger.info(`Diagrams saved to: ${outputDir}`);
  logger.info('Include in docs: ```mermaid blocks from these files');
}
