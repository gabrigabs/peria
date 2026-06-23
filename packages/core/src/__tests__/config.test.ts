/**
 * Tests for configuration loading
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { loadConfig, configExists } from '../config/loader.js'
import { writeFile, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

describe('loadConfig', () => {
  let testDir: string

  beforeEach(async () => {
    // Create unique directory for each test
    const { randomUUID } = await import('node:crypto')
    testDir = join(import.meta.dirname, `test-config-${randomUUID()}`)
    await mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    if (testDir) {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  it('returns null when no config file exists', async () => {
    const config = await loadConfig(testDir)
    expect(config).toBeNull()
  })

  it('loads peria.config.ts', async () => {
    await writeFile(
      join(testDir, 'peria.config.ts'),
      `
export default {
  framework: 'nestjs',
  entrypoint: 'src/main.ts',
  docs: {
    route: '/api-docs',
    outputDir: 'generated-docs'
  }
}
`
    )
    const config = await loadConfig(testDir)
    expect(config).not.toBeNull()
    expect(config?.framework).toBe('nestjs')
    expect(config?.entrypoint).toBe('src/main.ts')
    expect(config?.docs?.route).toBe('/api-docs')
  })

  it('extracts feature flags', async () => {
    await writeFile(
      join(testDir, 'peria.config.ts'),
      `export default {
  features: {
    wiki: true,
    driftCheck: false,
  }
}
`
    )
    const config = await loadConfig(testDir)
    expect(config?.features?.wiki).toBe(true)
    expect(config?.features?.driftCheck).toBe(false)
  })

  it('extracts sources configuration', async () => {
    await writeFile(
      join(testDir, 'peria.config.ts'),
      `export default {
  sources: {
    openapi: 'openapi.yaml'
  }
}
`
    )
    const config = await loadConfig(testDir)
    expect(config?.sources?.openapi).toBe('openapi.yaml')
  })
})

describe('configExists', () => {
  let testDir: string

  beforeEach(async () => {
    const { randomUUID } = await import('node:crypto')
    testDir = join(import.meta.dirname, `test-config-exists-${randomUUID()}`)
    await mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    if (testDir) {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  it('returns false when no config exists', async () => {
    const exists = await configExists(testDir)
    expect(exists).toBe(false)
  })

  it('returns true when peria.config.ts exists', async () => {
    await writeFile(join(testDir, 'peria.config.ts'), 'export default {}')
    const exists = await configExists(testDir)
    expect(exists).toBe(true)
  })

  it('prefers .ts over .js', async () => {
    await writeFile(join(testDir, 'peria.config.ts'), 'export default { framework: "nestjs" }')
    await writeFile(join(testDir, 'peria.config.js'), 'export default { framework: "express" }')
    const config = await loadConfig(testDir)
    expect(config?.framework).toBe('nestjs')
  })
})
