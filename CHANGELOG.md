# Changelog

All notable changes to Peria are recorded here. Peria is still in the `0.x` line, so this file separates the current unpublished branch from the packages already visible on npm.

## Unreleased

### Added

- Added a richer generated Application Map with areas, claim provenance status, release signals, package publish status, CLI bins, and recent changes.
- Added a generated GitHub Map page from `.peria/github.json`, including roadmap issues, milestones, commits, relation counts, and Mermaid diagrams.
- Added `bun run pack:check` to validate publishable tarball contents before release.
- Added `bun run dogfood:preview` to pack local core, renderer, and CLI tarballs, run the generated Fumadocs preview app, and verify `/docs/overview` plus `/api/search`.
- Added CI and publish gates for build, typecheck, tests, docs drift, pack validation, preview dogfood, NestJS adapter dogfood, and npm fresh-install dogfood.
- Added README sections for shipped behavior, roadmap status, example output, real-use positioning, and limitations.

### Changed

- `peria build --renderer fumadocs` now generates a better organized wiki surface with release status, application map, development map, known gaps, GitHub Issues, and GitHub Map pages.
- `@peria/api-reference` is private/deferred until the API-reference product surface is implemented and tested.
- Public documentation now treats `@peria/sdk` as private/deferred instead of a stable user-facing package.
- The publish workflow now pushes version commits and tags only after local release gates pass.

### Fixed

- Fixed preview-template copying from installed packages so the renderer app template is not skipped just because it lives below `node_modules`.
- Fixed GitHub milestone relation handling for milestone number `0`.

## Published Packages

Verified on 2026-06-29:

| Package | npm version | Status |
|---------|-------------|--------|
| `@peria/cli` | `0.1.2` | Latest published CLI |
| `@peria/core` | `0.1.1` | Published engine package |
| `@peria/renderer` | `0.1.1` | Published renderer package |
| `@peria/adapters` | `0.1.1` | Published Express, Fastify, and NestJS adapters |

`@peria/sdk` and `@peria/api-reference` are private/deferred in the repository and should not be published until their contracts are stable and externally dogfooded.

## Beta Policy

- Peria remains experimental while package versions are below `1.0.0`.
- Breaking changes may ship in `0.x` minor releases.
- Patch releases should be reserved for fixes that preserve the current command/package contracts.
- The current beta public surface is limited to `@peria/core`, `@peria/cli`, `@peria/renderer`, and `@peria/adapters`.
- New public packages need external-consumer tests and pack validation before publication.
- Every release candidate should pass `bun run build`, `bun run typecheck`, `bun run test`, `bun run docs:check`, `bun run pack:check`, `bun run dogfood:preview`, `bun run dogfood:nest`, and `bun run dogfood:npm`.
