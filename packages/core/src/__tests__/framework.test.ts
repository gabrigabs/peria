/**
 * Tests for framework detection
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { detectFramework, getFrameworkOptions } from '../detectors/framework.js'
import { writeFile, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

const testDir = join(import.meta.dirname, 'test-framework-tmp')

describe('detectFramework', () => {
  beforeEach(async () => {
    await mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  it('returns null when no package.json exists', async () => {
    const result = await detectFramework(testDir)
    expect(result).toBeNull()
  })

  it('detects NestJS from dependencies', async () => {
    await writeFile(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          '@nestjs/core': '^10.0.0',
        },
      })
    )
    const result = await detectFramework(testDir)
    expect(result).not.toBeNull()
    expect(result?.framework).toBe('nestjs')
    expect(result?.confidence).toBe('high')
  })

  it('detects Express from dependencies', async () => {
    await writeFile(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          express: '^4.18.0',
        },
      })
    )
    const result = await detectFramework(testDir)
    expect(result).not.toBeNull()
    expect(result?.framework).toBe('express')
    expect(result?.confidence).toBe('high')
  })

  it('detects Fastify from dependencies', async () => {
    await writeFile(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          fastify: '^4.0.0',
        },
      })
    )
    const result = await detectFramework(testDir)
    expect(result).not.toBeNull()
    expect(result?.framework).toBe('fastify')
  })

  it('detects Hono from dependencies', async () => {
    await writeFile(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          hono: '^4.0.0',
        },
      })
    )
    const result = await detectFramework(testDir)
    expect(result).not.toBeNull()
    expect(result?.framework).toBe('hono')
  })

  it('detects Elysia from dependencies', async () => {
    await writeFile(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          elysia: '^1.0.0',
        },
      })
    )
    const result = await detectFramework(testDir)
    expect(result).not.toBeNull()
    expect(result?.framework).toBe('elysia')
  })

  it('checks both dependencies and devDependencies', async () => {
    await writeFile(
      join(testDir, 'package.json'),
      JSON.stringify({
        devDependencies: {
          '@nestjs/core': '^10.0.0',
        },
      })
    )
    const result = await detectFramework(testDir)
    expect(result).not.toBeNull()
    expect(result?.framework).toBe('nestjs')
  })

  it('returns null for unknown frameworks', async () => {
    await writeFile(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          react: '^18.0.0',
        },
      })
    )
    const result = await detectFramework(testDir)
    expect(result).toBeNull()
  })
})

describe('getFrameworkOptions', () => {
  it('returns array of framework options', () => {
    const options = getFrameworkOptions()
    expect(options.length).toBeGreaterThan(0)
    expect(options).toContainEqual(expect.objectContaining({ value: 'nestjs' }))
    expect(options).toContainEqual(expect.objectContaining({ value: 'express' }))
    expect(options).toContainEqual(expect.objectContaining({ value: 'fastify' }))
    expect(options).toContainEqual(expect.objectContaining({ value: 'hono' }))
    expect(options).toContainEqual(expect.objectContaining({ value: 'elysia' }))
  })

  it('each option has value and label', () => {
    const options = getFrameworkOptions()
    for (const option of options) {
      expect(option).toHaveProperty('value')
      expect(option).toHaveProperty('label')
      expect(typeof option.value).toBe('string')
      expect(typeof option.label).toBe('string')
    }
  })
})
