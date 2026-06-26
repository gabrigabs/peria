/**
 * Scan command - Scans repository and generates manifest
 */

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { scan, writeManifest } from '@peria/core';
import { logger } from '../utils/logger.js';

/**
 * Run the scan command
 */
export async function scanCommand(cwd: string): Promise<void> {
  logger.header('Peria Scan');

  logger.info('Scanning repository...');

  const result = await scan(cwd);

  // Write manifest
  const manifestDir = join(cwd, '.peria');
  await mkdir(manifestDir, { recursive: true });

  const manifestPath = await writeManifest(cwd, result.manifest);

  // Print summary
  console.log();
  logger.success('Scan complete!');

  console.log();
  logger.info('Summary:');
  console.log(
    `  Framework: ${result.manifest.framework?.name || 'unknown'} (${result.manifest.framework?.confidence || 'unknown'})`
  );
  console.log(`  Routes: ${result.manifest.routes.length}`);
  console.log(`  Schemas: ${result.manifest.schemas.length}`);
  console.log(`  OpenAPI operations: ${result.manifest.openapiOps.length}`);
  console.log(`  Docs pages: ${result.manifest.docsPages.length}`);
  console.log(`  Packages: ${result.manifest.packages.length}`);
  console.log(`  Source files: ${result.manifest.sourceFiles.length}`);
  console.log(`  Relations: ${result.manifest.relations.length}`);
  console.log(`  Scan duration: ${result.manifest.stats.durationMs}ms`);

  if (result.manifest.openapi) {
    console.log();
    logger.info('OpenAPI:');
    console.log(`  Version: ${result.manifest.openapi.version || 'unknown'}`);
    console.log(`  Paths: ${result.manifest.openapi.paths.length}`);
    console.log(`  Schemas: ${result.manifest.openapi.schemas.length}`);

    if (result.manifest.openapi.enrichedPath) {
      console.log(`  Enriched: ${result.manifest.openapi.enrichedPath}`);
    }
  }

  if (result.manifest.llms?.exists) {
    console.log();
    logger.info('Agent context:');
    console.log(`  llms.txt: ${result.manifest.llms.path} (${result.manifest.llms.variant})`);
    console.log(`  Pages linked: ${result.manifest.llms.pageCount}`);
  }

  // Print warnings
  if (result.warnings.length > 0) {
    console.log();
    logger.warning(`${result.warnings.length} warning(s):`);

    for (const warning of result.warnings) {
      console.log();
      console.log(`  [${warning.code}] ${warning.message}`);
      if (warning.file) {
        console.log(`    File: ${warning.file}`);
      }
      if (warning.suggestion) {
        console.log(`    Suggestion: ${warning.suggestion}`);
      }
    }
  }

  console.log();
  logger.success(`Manifest written to ${manifestPath}`);

  // Git info
  console.log();
  logger.info('Git info:');
  console.log(`  Branch: ${result.manifest.git.branch}`);
  console.log(`  Commit: ${result.manifest.git.shortCommit}`);
  console.log(`  Status: ${result.manifest.git.isDirty ? 'dirty (uncommitted changes)' : 'clean'}`);

  if (result.manifest.git.isDirty) {
    console.log(`  Changed files: ${result.manifest.git.changedFiles.length}`);
  }
}
