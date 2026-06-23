# Packages

Packages are documented as ownership boundaries, not just manifest rows. Each section combines package.json metadata, TypeScript source coverage, internal imports, and configured editorial context.

## peria

**Role:** Workspace orchestration root

**Audience:** Contributors running repo-wide build, typecheck, test, and release preparation commands.

**Responsibilities:**

- Coordinate Bun workspaces.
- Expose root scripts that validate every package.
- Carry the self-documentation config for this repository.

**Why it matters:**

This package contributes 0 source modules and 0 exported declarations to the generated knowledge graph. Its manifest lives at `package.json`, so package metadata and scripts remain traceable to source.

**Surface:**

- Directory: `.`
- Version: 0.1.0
- Scripts: `build`, `typecheck`, `test`, `dev`
- Package exports: none
- Internal package imports: none detected
- External dependencies: `@peria/core`, `vitest`

## @peria/adapters

**Role:** Runtime integration layer

**Audience:** API teams embedding generated docs in framework applications.

**Responsibilities:**

- Expose framework-specific entrypoints for Express, Fastify, NestJS, Hono, and Elysia.
- Keep adapter contracts thin until generated artifacts are stable.

**Why it matters:**

This package contributes 6 source modules and 30 exported declarations to the generated knowledge graph. Its manifest lives at `packages/adapters/package.json`, so package metadata and scripts remain traceable to source.

**Surface:**

- Directory: `packages/adapters`
- Version: 0.1.0
- Scripts: `build`, `typecheck`, `test`, `dev`
- Package exports: `.`, `./elysia`, `./express`, `./fastify`, `./hono`, `./nest`
- Internal package imports: none detected
- External dependencies: `@types/node`, `tsup`, `typescript`

## @peria/cli

**Role:** Operator interface

**Audience:** Developers running Peria locally or wiring it into scripts.

**Responsibilities:**

- Initialize project configuration.
- Build the wiki and artifacts.
- Serve the generated static docs locally.

**Why it matters:**

This package contributes 11 source modules and 19 exported declarations to the generated knowledge graph. Its manifest lives at `packages/cli/package.json`, so package metadata and scripts remain traceable to source.

**Surface:**

- Directory: `packages/cli`
- Version: 0.1.0
- Scripts: `build`, `typecheck`, `test`, `dev`, `prepublishOnly`
- Package exports: none
- Internal package imports: `@peria/core`
- External dependencies: `@clack/prompts`, `@peria/core`, `@types/node`, `cac`, `chalk`, `tsup`, `typescript`

## @peria/core

**Role:** Knowledge engine

**Audience:** Contributors changing extraction, graph, config, or wiki generation behavior.

**Responsibilities:**

- Resolve configuration and defaults.
- Extract packages, modules, exports, commands, adapters, features, context files, and Git metadata.
- Generate markdown pages, manifest data, llms.txt content, and graph artifacts.

**Why it matters:**

This package contributes 17 source modules and 113 exported declarations to the generated knowledge graph. Its manifest lives at `packages/core/package.json`, so package metadata and scripts remain traceable to source.

**Surface:**

- Directory: `packages/core`
- Version: 0.1.0
- Scripts: `build`, `typecheck`, `test`, `test:run`, `dev`
- Package exports: `.`, `./config`, `./detectors`
- Internal package imports: none detected
- External dependencies: `@types/node`, `ts-morph`, `tsup`, `typescript`, `vitest`, `zod`

## @peria/docs-ui

**Role:** Future packaged reader UI

**Audience:** Users consuming generated docs in a browser.

**Responsibilities:**

- Provide the eventual reusable UI package for the generated wiki.
- Remain separate from the current CLI-emitted static reader while the UX stabilizes.

**Why it matters:**

This package contributes 1 source modules and 2 exported declarations to the generated knowledge graph. Its manifest lives at `packages/docs-ui/package.json`, so package metadata and scripts remain traceable to source.

**Surface:**

- Directory: `packages/docs-ui`
- Version: 0.1.0
- Scripts: `build`, `typecheck`, `test`, `dev`
- Package exports: none
- Internal package imports: none detected
- External dependencies: `@types/node`, `tsup`, `typescript`

## @peria/sdk

**Role:** Programmatic API surface

**Audience:** Tools that need to call Peria without going through the CLI.

**Responsibilities:**

- Define SDK instance contracts.
- Prepare for embedded server and graph/search access.

**Why it matters:**

This package contributes 3 source modules and 11 exported declarations to the generated knowledge graph. Its manifest lives at `packages/sdk/package.json`, so package metadata and scripts remain traceable to source.

**Surface:**

- Directory: `packages/sdk`
- Version: 0.1.0
- Scripts: `build`, `typecheck`, `test`, `dev`
- Package exports: `.`
- Internal package imports: none detected
- External dependencies: `@peria/core`, `@types/node`, `tsup`, `typescript`
