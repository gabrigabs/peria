# Application Map

The application map is the compact artifact for answering what exists, where it lives, and how the current wiki output is connected.

## Project

- Name: Peria
- Framework: `other`
- Entrypoint: `packages/cli/src/index.ts`
- Generated at: 2026-06-29T18:31:24.713Z

## Summary

| Area | Count |
| --- | --- |
| packages | 7 |
| modules | 163 |
| routes | 0 |
| schemas | 0 |
| commands | 2 |
| adapters | 5 |
| pages | 15 |
| claims | 1003 |

## Entrypoints

- CLI commands: `init`, `serve`
- Adapters: `express`, `fastify`, `nest`, `shared`, `smoke.test`

## Packages

| Package | Directory | Dependencies | Exports |
| --- | --- | --- | --- |
| peria | `.` | 4 | 0 |
| @peria/adapters | `packages/adapters` | 10 | 4 |
| @peria/api-reference | `packages/api-reference` | 5 | 1 |
| @peria/cli | `packages/cli` | 9 | 0 |
| @peria/core | `packages/core` | 11 | 4 |
| @peria/renderer | `packages/renderer` | 6 | 2 |
| @peria/sdk | `packages/sdk` | 3 | 1 |

## Modules

| Module | Package | Imports | Exports |
| --- | --- | --- | --- |
| `packages/adapters/src/__tests__/smoke.test.ts` | @peria/adapters | 5 | 0 |
| `packages/adapters/src/express.ts` | @peria/adapters | 2 | 2 |
| `packages/adapters/src/fastify.ts` | @peria/adapters | 3 | 3 |
| `packages/adapters/src/index.ts` | @peria/adapters | 0 | 9 |
| `packages/adapters/src/nest.ts` | @peria/adapters | 3 | 3 |
| `packages/adapters/src/shared.ts` | @peria/adapters | 3 | 7 |
| `packages/api-reference/src/index.ts` | @peria/api-reference | 0 | 0 |
| `packages/api-reference/src/types/stoplight.d.ts` | @peria/api-reference | 0 | 0 |
| `packages/cli/src/__tests__/integration.test.ts` | @peria/cli | 6 | 0 |
| `packages/cli/src/__tests__/smoke.test.ts` | @peria/cli | 1 | 0 |
| `packages/cli/src/commands/build.ts` | @peria/cli | 6 | 1 |
| `packages/cli/src/commands/check.ts` | @peria/cli | 3 | 1 |
| `packages/cli/src/commands/context.ts` | @peria/cli | 3 | 1 |
| `packages/cli/src/commands/diagram.ts` | @peria/cli | 3 | 1 |
| `packages/cli/src/commands/github.ts` | @peria/cli | 7 | 9 |
| `packages/cli/src/commands/init.ts` | @peria/cli | 9 | 4 |
| `packages/cli/src/commands/scan.ts` | @peria/cli | 4 | 1 |
| `packages/cli/src/commands/serve.ts` | @peria/cli | 8 | 1 |
| `packages/cli/src/generators/config.ts` | @peria/cli | 3 | 2 |
| `packages/cli/src/index.ts` | @peria/cli | 10 | 0 |
| `packages/cli/src/prompts/entrypoint.ts` | @peria/cli | 2 | 1 |
| `packages/cli/src/prompts/features.ts` | @peria/cli | 1 | 3 |
| `packages/cli/src/prompts/framework.ts` | @peria/cli | 2 | 2 |
| `packages/cli/src/prompts/route.ts` | @peria/cli | 2 | 1 |
| `packages/cli/src/utils/logger.ts` | @peria/cli | 1 | 3 |
| `packages/cli/src/utils/manifest.ts` | @peria/cli | 3 | 4 |
| `packages/core/fixtures/nestjs-api/src/app.module.ts` | @peria/core | 2 | 1 |
| `packages/core/fixtures/nestjs-api/src/main.ts` | @peria/core | 3 | 0 |
| `packages/core/fixtures/nestjs-api/src/users/dto/approve-user-request.dto.ts` | @peria/core | 0 | 1 |
| `packages/core/fixtures/nestjs-api/src/users/users.controller.ts` | @peria/core | 2 | 1 |
| `packages/core/fixtures/nestjs-api/src/users/users.module.ts` | @peria/core | 2 | 1 |
| `packages/core/fixtures/nestjs-basic/src/app.module.ts` | @peria/core | 3 | 1 |
| `packages/core/fixtures/nestjs-basic/src/auth/auth.controller.ts` | @peria/core | 2 | 1 |
| `packages/core/fixtures/nestjs-basic/src/auth/auth.module.ts` | @peria/core | 3 | 1 |
| `packages/core/fixtures/nestjs-basic/src/auth/auth.service.ts` | @peria/core | 1 | 3 |
| `packages/core/fixtures/nestjs-basic/src/auth/guards/jwt-auth.guard.ts` | @peria/core | 2 | 1 |
| `packages/core/fixtures/nestjs-basic/src/main.ts` | @peria/core | 2 | 0 |
| `packages/core/fixtures/nestjs-basic/src/users/dto/create-user.dto.ts` | @peria/core | 0 | 1 |
| `packages/core/fixtures/nestjs-basic/src/users/dto/update-user.dto.ts` | @peria/core | 0 | 1 |
| `packages/core/fixtures/nestjs-basic/src/users/users.controller.ts` | @peria/core | 5 | 1 |

## Routes

_No entries found._

## Schemas

_No entries found._

## OpenAPI Operations

_No entries found._

## Documentation Pages

| Title | Slug | Path |
| --- | --- | --- |
| Peria Overview | `overview` | `pages/overview.md` |
| Packages | `packages` | `pages/packages.md` |
| CLI Commands | `cli` | `pages/cli.md` |
| TypeScript Modules | `modules` | `pages/modules.md` |
| Adapters | `adapters` | `pages/adapters.md` |
| Configuration And Features | `configuration` | `pages/configuration.md` |
| Fumadocs Output | `wiki-ui` | `pages/wiki-ui.md` |
| History | `history` | `pages/history.md` |
| AI Context Map | `ai-context` | `pages/ai-context.md` |
| Diagrams | `diagrams` | `pages/diagrams.md` |
| Application Map | `application-map` | `pages/application-map.md` |
| Development Map | `development-map` | `pages/development-map.md` |
| Release Status | `release-status` | `pages/release-status.md` |
| Known Gaps | `known-gaps` | `pages/known-gaps.md` |
| GitHub Issues | `github-issues` | `pages/github-issues.md` |

## Git Context

- Branch: `feat/planning`
- Commit: `67ac65b8416ffe0e096598a05c74991e2fb66f8d`
- Working tree: 36 changed files
