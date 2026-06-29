# Development Map

Use this page as the maintenance entrypoint before changing a package boundary, CLI command, adapter, or generated docs contract.

## Change Areas

| Area | Directory | Modules | Exports | Internal dependencies |
| --- | --- | --- | --- | --- |
| peria | `.` | 0 | 0 | none |
| @peria/adapters | `packages/adapters` | 6 | 24 | none |
| @peria/api-reference | `packages/api-reference` | 2 | 0 | none |
| @peria/cli | `packages/cli` | 18 | 35 | `@peria/core`, `@peria/renderer`, `@peria/renderer/preview` |
| @peria/core | `packages/core` | 127 | 633 | none |
| @peria/renderer | `packages/renderer` | 11 | 105 | `@peria/core` |
| @peria/sdk | `packages/sdk` | 1 | 2 | none |

## Entrypoints

| Surface | Entries |
| --- | --- |
| CLI commands | `init`, `serve` |
| Adapters | `express`, `fastify`, `nest`, `shared`, `smoke.test` |
| Docs renderer | `fumadocs` at `docs` |

## Impact Reading Map

| Area | Start with | Coverage |
| --- | --- | --- |
| peria | none | complete |
| @peria/adapters | `packages/adapters/src/__tests__/smoke.test.ts`, `packages/adapters/src/express.ts`, `packages/adapters/src/fastify.ts`, `packages/adapters/src/index.ts`, `packages/adapters/src/nest.ts` | 1 more files |
| @peria/api-reference | `packages/api-reference/src/index.ts`, `packages/api-reference/src/types/stoplight.d.ts` | complete |
| @peria/cli | `packages/cli/src/__tests__/integration.test.ts`, `packages/cli/src/__tests__/smoke.test.ts`, `packages/cli/src/commands/build.ts`, `packages/cli/src/commands/check.ts`, `packages/cli/src/commands/context.ts` | 13 more files |
| @peria/core | `packages/core/fixtures/nestjs-api/src/app.module.ts`, `packages/core/fixtures/nestjs-api/src/main.ts`, `packages/core/fixtures/nestjs-api/src/users/dto/approve-user-request.dto.ts`, `packages/core/fixtures/nestjs-api/src/users/users.controller.ts`, `packages/core/fixtures/nestjs-api/src/users/users.module.ts` | 122 more files |
| @peria/renderer | `packages/renderer/app-template/src/lib/source.ts`, `packages/renderer/app-template/src/routes/api/search.ts`, `packages/renderer/src/config.ts`, `packages/renderer/src/content.ts`, `packages/renderer/src/fumadocs.ts` | 6 more files |
| @peria/sdk | `packages/sdk/src/index.ts` | complete |

## Suggested Reading Order

- Start with `application-map` to inspect the generated aggregate.
- Use `packages` before changing public package exports or dependencies.
- Use `modules` before moving source files or changing imports.
- Use `diagrams` when dependency or module relationships are the risky part of a change.
- Use `history` to connect the current working tree to recent commits.
