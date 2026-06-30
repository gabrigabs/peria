# Packages

Packages are documented as ownership boundaries, not just manifest rows. Each section combines package.json metadata, TypeScript source coverage, internal imports, and configured editorial context.

## peria-example-nestjs-api

**Role:** Example application

**Audience:** New Peria users and release validators

**Responsibilities:**

- Expose a small NestJS route surface.
- Carry OpenAPI and DTO sources for scanner coverage.
- Serve generated Peria docs through the NestJS adapter.

**Why it matters:**

This package contributes 0 source modules and 0 exported declarations to the generated knowledge graph. Its manifest lives at `package.json`, so package metadata and scripts remain traceable to source.

**Surface:**

- Directory: `.`
- Version: 0.1.0
- Publish status: private/deferred
- Scripts: `build`, `start`, `peria:scan`, `peria:build`, `peria:check`
- Package exports: none
- CLI bins: none
- Internal package imports: none detected
- External dependencies: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@peria/adapters`, `@peria/cli`, `@peria/core`, `@types/node`, `reflect-metadata`, `rxjs`, `typescript`
