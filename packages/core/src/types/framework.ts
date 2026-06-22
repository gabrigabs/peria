/**
 * Framework detection types
 */

export type DetectedFramework =
  | 'nestjs'
  | 'express'
  | 'fastify'
  | 'hono'
  | 'elysia'
  | 'other'

export interface FrameworkInfo {
  framework: DetectedFramework
  confidence: 'high' | 'medium' | 'low'
  evidence?: string
}

export const FRAMEWORK_PACKAGES: Record<string, DetectedFramework> = {
  '@nestjs/core': 'nestjs',
  express: 'express',
  fastify: 'fastify',
  hono: 'hono',
  elysia: 'elysia',
}

export const FRAMEWORK_LABELS: Record<DetectedFramework, string> = {
  nestjs: 'NestJS',
  express: 'Express',
  fastify: 'Fastify',
  hono: 'Hono',
  elysia: 'Elysia',
  other: 'Other / Manual',
}
