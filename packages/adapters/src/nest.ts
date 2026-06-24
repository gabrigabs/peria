/**
 * NestJS adapter for Peria
 *
 * Usage:
 * ```ts
 * import { setupPeriaDocs } from '@peria/adapters/nest'
 *
 * // In your main.ts or app.module.ts
 * setupPeriaDocs(app, {
 *   route: '/docs'
 * })
 * ```
 */

export interface PeriaNestOptions {
  route?: string;
  docsPath?: string;
}

export interface NestApplication {
  use: (path: string, handler: unknown) => void;
}

export function setupPeriaDocs(_app: NestApplication, options?: PeriaNestOptions): void {
  console.log('Peria NestJS adapter - coming soon');
  console.log('Route:', options?.route ?? '/docs');
}
