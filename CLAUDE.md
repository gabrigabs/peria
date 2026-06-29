# CLAUDE.md

This file contains instructions for Claude Code working with Peria.

## Project Overview

**Peria** is a living technical wiki for codebases — an open-source CLI and SDK that extracts context from code and generates documentation automatically.

**Positioning:** Human-readable by default. LLM-ready by design.

**Core thesis:** Peria helps humans understand codebases and generates reliable context for AI agents.

## Project Structure

```
peria/
├── packages/
│   ├── core/        # Engine principal — types, config, detectors
│   ├── cli/         # Command-line interface
│   ├── sdk/         # SDK para uso programático
│   ├── adapters/    # Express, Fastify, NestJS adapters
│   └── renderer/    # Static wiki renderer
├── package.json      # Root workspace
├── tsconfig.base.json
└── README.md
```

## Commands

```bash
# Install dependencies
bun install

# Typecheck all packages
bun run typecheck

# Build all packages
bun run build

# Watch mode for development
bun run dev

# Test (placeholder)
bun run test
```

## Adding a New CLI Command

1. Create the command file in `packages/cli/src/commands/`:

```typescript
// packages/cli/src/commands/mycommand.ts
import { logger } from '../utils/logger.js'

export async function myCommand(cwd: string): Promise<void> {
  logger.info('My command running...')
}
```

2. Register the command in `packages/cli/src/index.ts`:

```typescript
import { myCommand } from './commands/mycommand.js'

cli.command('mycommand', 'Description').action(async (opts) => {
  await myCommand(opts.cwd)
})
```

3. Add prompts if needed in `packages/cli/src/prompts/`

## Adding a New Adapter

1. Create the adapter file in `packages/adapters/src/`:

```typescript
// packages/adapters/src/myframework.ts
import type { MyFrameworkApp } from 'my-framework'

export interface PeriaDocsOptions {
  route?: string
  docsPath?: string
}

export function periaDocs(options?: PeriaDocsOptions) {
  return (app: MyFrameworkApp) => {
    // Implementation
  }
}
```

2. Export from adapters package index

3. Add to `packages/adapters/package.json` exports

4. Update `packages/adapters/tsup.config.ts` entry

## Adding a New Parser/Feature

Parsers live in `packages/core/src/parsers/`:

```typescript
// packages/core/src/parsers/myparser.ts
export async function parseMyFormat(
  filepath: string,
  options?: ParseOptions
): Promise<ParsedResult> {
  // Implementation
}
```

Export from `packages/core/src/parsers/index.ts`

## Node.js / Bun Compatibility

- All packages use ESM (`"type": "module"`)
- Use `.js` extension in imports (TypeScript handles resolution)
- Bun is primary runtime, but keep Node.js >= 20 compatible
- Test with `node` after `bun run build`

## MVP Scope — What to Implement

Focus on making these work:

1. ✅ CLI with `init` wizard
2. ✅ `build` command that generates a self-wiki
3. `serve` command for local preview
4. Code map extraction (routes, controllers, schemas)
5. OpenAPI integration
6. ✅ llms.txt generation from the wiki tree
7. Embedded /docs in adapters

## What NOT to Implement Yet

- Vector DB or embeddings
- GitHub App
- SaaS or hosting
- Complex dashboard
- Production-ready UI
- Advanced search
- Multi-user support

## MVP Limits

- Config loader uses basic regex extraction for TS files
- ts-morph is used for the initial module/export map
- Graph generation exists for the self-wiki slice, but framework-specific relationships are still future work
- Parsers throw "not implemented" errors

## Current Self-Wiki Slice

`peria build` now generates the first self-documenting wiki for this repository:

- `docs/pages/*.md` contains the human-readable wiki pages
- `docs/content/docs/*.mdx` contains Fumadocs-compatible content generated from the same wiki pages
- `docs/source.config.ts` and `docs/lib/source.ts` provide the Fumadocs collection and loader bridge
- `.eria/graph.json` stores serializable entities and claims with source/line/commit provenance
- `.peria/application-map.json` stores the aggregate package/module/docs/Git map
- `llms.txt` is derived from the human wiki tree and points agents back to the wiki

The current extractor covers packages, CLI commands, TypeScript modules, exported declarations, adapters, config/features, wiki UI, recent Git history, and configured AI context files. It does not yet parse framework routes, OpenAPI specs, controllers, schemas, DTOs, or doc drift.

The generated pages should read like a project-specific wiki, not a generic index. `peria.config.ts` supports a `project` profile with name, tagline, audience, tone, problem, current focus, highlights, and `packageContexts`. The builder also records branch, commit, author, authored date, dirty working-tree files, and recent commits in the History page, manifest, and graph artifact.

## Key Files

| File | Purpose |
|------|---------|
| `packages/core/src/types/config.ts` | Config types and `defineConfig` |
| `packages/core/src/wiki/builder.ts` | Self-wiki builder and graph generation |
| `packages/core/src/detectors/framework.ts` | Framework detection |
| `packages/cli/src/commands/init.ts` | Init wizard |
| `packages/cli/src/commands/build.ts` | Writes `/docs`, `.eria/graph.json`, and `llms.txt` |
| `packages/cli/src/generators/config.ts` | Config file generator |
| `packages/cli/src/prompts/features.ts` | Feature selection options |

## Design Principles

1. **Human-first** — Wiki pages are canonical, llms.txt is derived
2. **Source truth** — All info traces back to source files
3. **Zero config default** — Auto-detect what we can
4. **Local-first** — Works offline, GitHub is additive

## TypeScript Settings

Strict mode is enforced. Key settings in `tsconfig.base.json`:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `moduleResolution: bundler`
