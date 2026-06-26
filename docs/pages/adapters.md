# Adapters

Adapters are the runtime bridge between generated artifacts and application frameworks. In this slice they intentionally stay thin while the generated `/docs` contract stabilizes.

Configured docs route: `/docs`

## Maturity

- `implemented` means the file exposes behavior without a placeholder marker.
- `placeholder` means the adapter contract exists but still returns or logs "coming soon" behavior.

## Adapter Surface

| Adapter | Status | Source | Exports |
| --- | --- | --- | --- |
| elysia | placeholder | `packages/adapters/src/elysia.ts` | ElysiaGroup (interface), ElysiaInstance (interface), periaDocs (function), PeriaDocsOptions (interface) |
| express | implemented | `packages/adapters/src/express.ts` | periaDocs (function), PeriaDocsOptions (interface) |
| fastify | implemented | `packages/adapters/src/fastify.ts` | FastifyInstance (interface), periaDocs (function), PeriaDocsOptions (interface) |
| hono | placeholder | `packages/adapters/src/hono.ts` | HonoContext (interface), periaDocs (function), PeriaDocsOptions (interface) |
| nest | implemented | `packages/adapters/src/nest.ts` | NestApplication (class), PeriaNestOptions (interface), setupPeriaDocs (function) |
