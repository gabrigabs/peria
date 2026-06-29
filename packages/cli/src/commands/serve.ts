/**
 * Serve command - preview the generated Fumadocs wiki using the bundled
 * TanStack Start + Fumadocs app shipped in `@peria/renderer`.
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, mkdir, readFile, rm, symlink } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { defineConfig, loadConfig } from '@peria/core'
import { previewAppDir } from '@peria/renderer/preview'
import { logger } from '../utils/logger.js'

const DEFAULT_PORT = 4173

export async function serveCommand(cwd: string): Promise<void> {
  const config = defineConfig((await loadConfig(cwd)) ?? {})
  const docsDir = resolve(cwd, config.docs.outputDir)
  const contentDocsDir = resolve(docsDir, 'content', 'docs')

  if (!existsSync(contentDocsDir)) {
    logger.header('Peria Serve')
    logger.warning(
      `No Fumadocs content found at ${contentDocsDir}. Run "peria build" before "peria serve".`
    )
    return
  }

  if (!existsSync(previewAppDir)) {
    logger.warning(
      `Preview app template not bundled with @peria/renderer at ${previewAppDir}. Update @peria/renderer.`
    )
    return
  }

  const cacheDir = resolve(cwd, '.peria', 'preview-app')
  await syncAppTemplate(previewAppDir, cacheDir)
  await linkContent(cacheDir, contentDocsDir)

  const pm = detectPackageManager()
  const port = getPort()

  logger.header('Peria Serve')
  logger.info(`Serving ${config.docs.outputDir} via ${pm} on port ${port}`)
  runDev(pm, cacheDir, port)
}

function getPort(): number {
  const rawPort = process.env.PERIA_PORT
  if (!rawPort) return DEFAULT_PORT
  const port = Number(rawPort)
  return Number.isInteger(port) && port > 0 ? port : DEFAULT_PORT
}

function detectPackageManager(): 'bun' | 'npm' {
  if (existsSync(resolve(process.cwd(), 'bun.lock')) || hasCommand('bun')) {
    return 'bun'
  }
  return 'npm'
}

function hasCommand(cmd: string): boolean {
  try {
    spawn(cmd, ['--version'], { stdio: 'ignore', shell: true })
    return true
  } catch {
    return false
  }
}

async function syncAppTemplate(templateDir: string, cacheDir: string): Promise<void> {
  const templateVersion = await readTemplateVersion(templateDir)
  const versionFile = join(cacheDir, '.template-version')

  if (existsSync(versionFile)) {
    const cached = await readFile(versionFile, 'utf-8')
    if (cached.trim() === templateVersion && existsSync(join(cacheDir, 'node_modules'))) {
      return
    }
  }

  logger.info('Syncing bundled preview app...')
  await rm(cacheDir, { recursive: true, force: true })
  await mkdir(cacheDir, { recursive: true })
  await cp(templateDir, cacheDir, {
    recursive: true,
    filter: (src) => !src.includes('node_modules') && !src.includes('.git'),
  })
  await installDeps(cacheDir)
  await writeFileAtomic(versionFile, templateVersion)
}

async function readTemplateVersion(templateDir: string): Promise<string> {
  try {
    const manifestPath = join(dirname(templateDir), 'package.json')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'))
    const hash = createHash('sha256')
    const rootFiles = ['package.json', 'vite.config.ts', 'source.config.ts', 'tsconfig.json']
    for (const file of rootFiles) {
      try {
        hash.update(`${file}:${await fingerprintFile(join(templateDir, file))};`)
      } catch {
        // ignore missing files
      }
    }
    await fingerprintDir(join(templateDir, 'src'), hash)
    return `${manifest.version ?? '0.0.0'}-${hash.digest('hex').slice(0, 12)}`
  } catch {
    return 'unknown'
  }
}

async function fingerprintDir(dir: string, hash: ReturnType<typeof createHash>): Promise<void> {
  let entries: import('node:fs').Dirent[]
  try {
    entries = await (await import('node:fs/promises')).readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await fingerprintDir(full, hash)
    } else if (entry.isFile()) {
      hash.update(`${full}:${await fingerprintFile(full)};`)
    }
  }
}

async function fingerprintFile(path: string): Promise<string> {
  const content = await readFile(path, 'utf-8')
  return `${content.length}:${createHash('sha256').update(content).digest('hex').slice(0, 8)}`
}

function installDeps(cacheDir: string): Promise<void> {
  const pm = detectPackageManager()
  return new Promise((res, rej) => {
    logger.info(`Installing preview app dependencies with ${pm}...`)
    const child = spawn(pm, ['install'], {
      cwd: cacheDir,
      stdio: 'inherit',
      shell: true,
    })
    child.on('exit', (code) => (code === 0 ? res() : rej(new Error(`${pm} install exited with ${code}`))))
    child.on('error', rej)
  })
}

async function linkContent(cacheDir: string, contentDocsDir: string): Promise<void> {
  const linkPath = resolve(cacheDir, 'content', 'docs')
  await rm(linkPath, { recursive: true, force: true })
  await mkdir(resolve(cacheDir, 'content'), { recursive: true })
  try {
    await symlink(contentDocsDir, linkPath, 'dir')
  } catch {
    // Symlink failed (e.g., Windows without dev mode) - fall back to copy.
    await cp(contentDocsDir, linkPath, { recursive: true })
  }
}

function runDev(pm: 'bun' | 'npm', cacheDir: string, port: number): void {
  const child = spawn(pm, ['run', 'dev'], {
    cwd: cacheDir,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PERIA_PORT: String(port) },
  })

  const stop = (): void => {
    child.kill('SIGTERM')
    process.exit(0)
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  child.on('exit', (code) => process.exit(code ?? 0))
}

async function writeFileAtomic(path: string, content: string): Promise<void> {
  const { writeFile } = await import('node:fs/promises')
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content, 'utf-8')
}