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
  const config = `import { defineConfig } from "@peria/core"

export default defineConfig({
  framework: "${options.framework}",
  entrypoint: "${options.entrypoint}",

  project: {
    name: "My Project",
    tagline: "Living documentation for this codebase.",
    description: "A source-backed technical wiki generated from code, docs, and Git history.",
    audience: "Engineers and AI agents working in this repository.",
    tone: "Pragmatic, source-linked, and implementation-aware.",
    problem: "Important implementation knowledge is spread across code, docs, config, and Git history.",
    currentFocus: "Keep the generated wiki useful for humans first and reusable as AI context."
  },

  docs: {
    enabled: true,
    route: "${options.docsRoute}",
    outputDir: "docs"
  },

  sources: {
    markdown: ["README.md", "docs/**/*.md"],
    llms: ["llms.txt"],
    context: ["CLAUDE.md", "AGENTS.md"]
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
