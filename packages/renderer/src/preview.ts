/**
 * Preview app locator.
 *
 * Resolves the path to the bundled TanStack Start + Fumadocs preview app
 * shipped inside `@peria/renderer`. The CLI uses this to spawn `vite dev`.
 *
 * The app-template lives outside `dist` (as static files in the published
 * package), so we resolve relative to this module's location.
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const moduleDir = dirname(fileURLToPath(import.meta.url))

export const previewAppDir: string = join(moduleDir, '..', 'app-template')