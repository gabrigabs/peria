# Adapters

Adapters are the runtime bridge between generated artifacts and application frameworks. In this slice they intentionally stay thin while the generated `/docs` contract stabilizes.

Configured docs route: `/docs`

## Maturity

- `implemented` means the file exposes behavior without a placeholder marker.
- `placeholder` means the adapter contract exists but still returns or logs "coming soon" behavior.

## Adapter Surface

| Adapter | Status | Source | Exports |
| --- | --- | --- | --- |
| express | implemented | `packages/adapters/src/express.ts` | periaDocs (function), PeriaDocsOptions (interface) |
| fastify | implemented | `packages/adapters/src/fastify.ts` | FastifyInstance (interface), periaDocs (function), PeriaDocsOptions (interface) |
| nest | implemented | `packages/adapters/src/nest.ts` | NestApplication (class), PeriaNestOptions (interface), setupPeriaDocs (function) |
| shared | implemented | `packages/adapters/src/shared.ts` | missingDocsPayload (function), PeriaDocsPathOptions (interface), readLlmsText (function), readWikiManifest (function), resolveDocsPaths (function), ResolvedPeriaDocsPaths (interface), resolveFallbackFile (function) |
| smoke.test | implemented | `packages/adapters/src/__tests__/smoke.test.ts` | none |
