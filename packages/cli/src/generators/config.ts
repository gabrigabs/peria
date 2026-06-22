/**
 * Config file generator
 */

import { writeFile } from 'node:fs/promises'
import type { FeatureFlags } from '../prompts/features.js'
import type { DetectedFramework } from '../prompts/framework.js'

interface GeneratedConfig {
  framework: DetectedFramework
  entrypoint: string
  docsRoute: string
  features: FeatureFlags
}

function formatFeatures(features: FeatureFlags): string {
  const entries = Object.entries(features)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `    ${key}: ${value}`)
    .join(',\n')

  return `features: {
${entries}
  }`
}

export async function generateConfig(options: GeneratedConfig): Promise<string> {
  const config = `import { defineConfig } from "peria/config"

export default defineConfig({
  framework: "${options.framework}",
  entrypoint: "${options.entrypoint}",

  docs: {
    enabled: true,
    route: "${options.docsRoute}"
  },

  ${formatFeatures(options.features)}
})
`

  return config
}

export async function writeConfigFile(cwd: string, content: string): Promise<string> {
  const filepath = `${cwd}/peria.config.ts`
  await writeFile(filepath, content, 'utf-8')
  return filepath
}
