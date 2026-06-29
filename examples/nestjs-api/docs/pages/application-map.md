# Application Map

The application map is the compact artifact for answering what exists, where it lives, how mature it is, and how the current wiki output is connected.

## Project

- Name: Peria NestJS API Example
- Framework: `nestjs`
- Entrypoint: `src/main.ts`
- Generated at: 2026-06-29T21:28:14.881Z

## Summary

| Area | Count |
| --- | --- |
| packages | 1 |
| modules | 0 |
| routes | 4 |
| schemas | 9 |
| commands | 0 |
| adapters | 0 |
| pages | 14 |
| claims | 24 |

## Release Signals

| Signal | Status | Detail |
| --- | --- | --- |
| Public package exports | ready | 0/0 releasable packages expose exports or CLI bins. |
| CLI command handlers | ready | 0/0 CLI commands have implemented handlers. |
| Adapter placeholders | ready | No placeholder adapters detected. |
| Route coverage | ready | 4 routes are present in the latest scan manifest. |
| Schema coverage | ready | 9 schemas are present in the latest scan manifest. |
| OpenAPI coverage | ready | 4 OpenAPI operations are present in the latest scan manifest. |

## Claim Quality

| Metric | Count |
| --- | --- |
| Total claims | 24 |
| Sourced claims | 24 |
| Unsourced claims | 0 |
| High confidence | 15 |
| Medium confidence | 9 |
| Low confidence | 0 |

## Application Areas

| Area | Directory | Modules | Exports | Internal dependencies |
| --- | --- | --- | --- | --- |
| peria-example-nestjs-api | `.` | 0 | 0 | none |

## Entrypoints

- CLI commands: none
- Adapters: none

## Packages

| Package | Directory | Publish | Dependencies | Exports | Bins |
| --- | --- | --- | --- | --- | --- |
| peria-example-nestjs-api | `.` | private | 10 | 0 | none |

## Modules

_No entries found._

## Routes

| Method | Path | Handler | Source |
| --- | --- | --- | --- |
| `GET` | `/users` | getUsers | `/Users/gabrielbezerrarodrigues/dev/peria/examples/nestjs-api/src/users/users.controller.ts:14` |
| `POST` | `/users` | createUser | `/Users/gabrielbezerrarodrigues/dev/peria/examples/nestjs-api/src/users/users.controller.ts:29` |
| `GET` | `/users/:id` | getUserById | `/Users/gabrielbezerrarodrigues/dev/peria/examples/nestjs-api/src/users/users.controller.ts:37` |
| `POST` | `/users/:id/approve` | approveUser | `/Users/gabrielbezerrarodrigues/dev/peria/examples/nestjs-api/src/users/users.controller.ts:50` |

## Schemas

| Schema | Type | Source |
| --- | --- | --- |
| CreateUserRequest | request | unknown |
| User | response | unknown |
| User | response | unknown |
| id | parameter | unknown |
| ApproveUserRequest | request | unknown |
| User | response | unknown |
| id | parameter | unknown |
| CreateUserDto | body | `/Users/gabrielbezerrarodrigues/dev/peria/examples/nestjs-api/src/users/users.controller.ts:4` |
| ApproveUserRequestDto | body | `/Users/gabrielbezerrarodrigues/dev/peria/examples/nestjs-api/src/users/dto/approve-user-request.dto.ts:1` |

## OpenAPI Operations

| Method | Path | Operation | Source |
| --- | --- | --- | --- |
| `GET` | `/users` | getUsers | `/Users/gabrielbezerrarodrigues/dev/peria/examples/nestjs-api/openapi.yaml` |
| `POST` | `/users` | createUser | `/Users/gabrielbezerrarodrigues/dev/peria/examples/nestjs-api/openapi.yaml` |
| `GET` | `/users/{id}` | getUserById | `/Users/gabrielbezerrarodrigues/dev/peria/examples/nestjs-api/openapi.yaml` |
| `POST` | `/users/{id}/approve` | approveUser | `/Users/gabrielbezerrarodrigues/dev/peria/examples/nestjs-api/openapi.yaml` |

## Documentation Pages

| Title | Slug | Path |
| --- | --- | --- |
| Peria NestJS API Example Overview | `overview` | `pages/overview.md` |
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

## Recent Changes

| Commit | Date | Author | Issue refs | Subject |
| --- | --- | --- | --- | --- |
| `6e3e5b5` | 2026-06-29 | Gabriel Bezerra Rodrigues | none | feat(renderer): render Mermaid diagrams in preview app |
| `18e9c5e` | 2026-06-29 | Gabriel Bezerra Rodrigues | none | chore(docs): regenerate wiki artifacts |
| `c23ceab` | 2026-06-29 | Gabriel Bezerra Rodrigues | none | docs: update TASKS and PUBLISHING for preview app |
| `591a8b2` | 2026-06-29 | Gabriel Bezerra Rodrigues | none | test(cli): drop removed artifact assertions |
| `31abbba` | 2026-06-29 | Gabriel Bezerra Rodrigues | none | fix(renderer): drop emitted source.config/lib/source and duplicate h1 |
| `ba78017` | 2026-06-29 | Gabriel Bezerra Rodrigues | none | fix(cli): clean source.config.ts and lib/ from old builds |
| `83ee570` | 2026-06-29 | Gabriel Bezerra Rodrigues | none | feat(cli): rewrite serve to spawn preview app |
| `7715d31` | 2026-06-29 | Gabriel Bezerra Rodrigues | none | feat(renderer): support ./preview subpath export |

## Git Context

- Branch: `feat/planning`
- Commit: `6e3e5b5b63e6992e799f9088f9a636ddbd0bbec6`
- Working tree: 54 changed files
