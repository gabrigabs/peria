# @peria/core

Core knowledge graph engine for Peria - source-backed evidence extraction for backend and API repositories.

## Features

- **Knowledge Graph**: Extract and connect routes, schemas, OpenAPI operations, and documentation
- **Framework Adapters**: Support for NestJS, Express, Fastify, Hono, and Elysia
- **Manifest Generation**: Create versioned `.peria/manifest.json` with full graph data
- **Audit Engine**: Detect documentation drift between code, OpenAPI, and docs
- **Context Packs**: Generate agent-ready context for coding assistants
- **Mermaid Diagrams**: Generate visual diagrams for routes and schemas

## Installation

```bash
npm install @peria/core
```

## Usage

```typescript
import { scan } from '@peria/core';

const manifest = await scan({
  cwd: process.cwd(),
  framework: 'nestjs',
});

// Generate audit report
import { runAuditChecks } from '@peria/core';
const auditResult = await runAuditChecks(manifest, {
  cwd: process.cwd(),
  checks: ['route-vs-openapi', 'docs-vs-routes'],
});

// Generate context packs
import { generateContextPacks } from '@peria/core';
const contextResult = await generateContextPacks(manifest, {
  cwd: process.cwd(),
});

// Generate diagrams
import { generateDiagrams } from '@peria/core';
const diagrams = generateDiagrams(manifest, {
  cwd: process.cwd(),
});
```

## API Reference

### Core Functions

- `scan(options)` - Scan repository and generate manifest
- `runAuditChecks(manifest, options)` - Run drift detection checks
- `generateContextPacks(manifest, options)` - Generate agent context packs
- `generateDiagrams(manifest, options)` - Generate Mermaid diagrams

### Exports

- `PeriaManifest` - Manifest type
- `RouteEntity`, `SchemaEntity`, `PackageEntity` - Graph entity types
- `AuditResult`, `CheckResult` - Audit result types

## License

MIT
