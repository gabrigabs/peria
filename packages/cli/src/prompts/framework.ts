/**
 * Framework selection prompts
 */

import { confirm, select } from '@clack/prompts';
import type { Framework } from '@peria/core';

export type DetectedFramework = Framework;

const FRAMEWORK_LABELS: Record<DetectedFramework, string> = {
  nestjs: 'NestJS',
  express: 'Express',
  fastify: 'Fastify',
  hono: 'Hono',
  elysia: 'Elysia',
  other: 'Other / Manual',
};

const FRAMEWORK_OPTIONS: { value: DetectedFramework; label: string }[] = [
  { value: 'nestjs', label: 'NestJS' },
  { value: 'express', label: 'Express' },
  { value: 'fastify', label: 'Fastify' },
  { value: 'hono', label: 'Hono' },
  { value: 'elysia', label: 'Elysia' },
  { value: 'other', label: 'Other / Manual' },
];

export async function promptFramework(detected?: DetectedFramework): Promise<DetectedFramework> {
  if (detected) {
    const confirmed = await confirm({
      message: `Detected framework: ${FRAMEWORK_LABELS[detected]}. Is this correct?`,
      initialValue: true,
    });

    if (confirmed) {
      return detected;
    }
  }

  const framework = await select({
    message: 'Which framework does your project use?',
    options: FRAMEWORK_OPTIONS,
  });

  return framework as DetectedFramework;
}
