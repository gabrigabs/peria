/**
 * Init command - wizard for creating peria.config.ts
 */

import { cancel, isCancel } from '@clack/prompts'
import chalk from 'chalk'
import { promptFramework } from '../prompts/framework.js'
import { promptEntrypoint } from '../prompts/entrypoint.js'
import { promptDocsRoute } from '../prompts/route.js'
import { promptFeatures, getFeatureSummary } from '../prompts/features.js'
import { generateConfig, writeConfigFile } from '../generators/config.js'
import { logger, step } from '../utils/logger.js'

import { detectFramework, detectEntrypoint, type Framework } from '@peria/core'

// Re-export for use in prompts
export type { Framework }
export { detectFramework, detectEntrypoint }

export async function initCommand(cwd: string): Promise<void> {
  logger.header('Peria Init')

  logger.dim('Let\'s set up Peria for your project.\n')

  // Step 1: Detect and confirm framework
  step(1, 'Framework detection')
  const detectedFramework = await detectFramework(cwd)
  const framework = await promptFramework(detectedFramework?.framework)
  if (isCancel(framework)) {
    cancel('Cancelled')
    process.exit(0)
  }
  logger.success(`Framework: ${framework}`)

  // Step 2: Detect and confirm entrypoint
  step(2, 'Entrypoint detection')
  const detectedEntrypoint = await detectEntrypoint(cwd)
  const entrypoint = await promptEntrypoint(detectedEntrypoint ?? undefined)
  if (isCancel(entrypoint)) {
    cancel('Cancelled')
    process.exit(0)
  }
  logger.success(`Entrypoint: ${entrypoint}`)

  // Step 3: Docs route
  step(3, 'Docs route')
  const docsRoute = await promptDocsRoute()
  if (isCancel(docsRoute)) {
    cancel('Cancelled')
    process.exit(0)
  }
  logger.success(`Route: ${docsRoute}`)

  // Step 4: Features
  step(4, 'Feature selection')
  const features = await promptFeatures()
  if (isCancel(features)) {
    cancel('Cancelled')
    process.exit(0)
  }

  console.log()
  logger.dim('Selected features:')
  for (const feature of getFeatureSummary(features)) {
    logger.success(`  ${feature}`)
  }

  // Step 5: Generate config
  console.log()
  step(5, 'Generating config')

  const configContent = await generateConfig({
    framework,
    entrypoint,
    docsRoute,
    features,
  })

  const configPath = await writeConfigFile(cwd, configContent)
  logger.success(`Created ${configPath}`)

  // Done
  console.log()
  logger.header('Done!')

  console.log(`
${chalk.green('✓')} peria.config.ts generated!

${chalk.bold('Next steps:')}

  ${chalk.dim('$')} bun install
  ${chalk.dim('$')} bun run peria build

${chalk.bold('Available commands:')}

  ${chalk.cyan('peria build')}   - Build documentation
  ${chalk.cyan('peria serve')}   - Preview docs locally
  ${chalk.cyan('peria check')}   - Check for drift
`)
}
