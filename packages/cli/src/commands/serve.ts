/**
 * Serve command stub
 */

import { logger } from '../utils/logger.js'

export async function serveCommand(_cwd: string): Promise<void> {
  logger.info('Serve command not implemented yet')
  logger.dim('Run "peria build" first to generate docs')
}
