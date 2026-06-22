/**
 * Build command stub
 */

import { logger } from '../utils/logger.js'

export async function buildCommand(_cwd: string): Promise<void> {
  logger.info('Build command not implemented yet')
  logger.dim('Run "peria init" first to create peria.config.ts')
}
