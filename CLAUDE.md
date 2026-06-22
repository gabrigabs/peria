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
│   ├── adapters/    # Express, Fastify, NestJS, Hono, Elysia adapters
│   └── docs-ui/      # UI da documentação (planejado)
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
2. `build` command that parses code
3. `serve` command for local preview
4. Code map extraction (routes, controllers, schemas)
5. OpenAPI integration
6. llms.txt generation
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
- Full ts-morph integration is future work
- Graph builder is stubbed
- Parsers throw "not implemented" errors

## Key Files

| File | Purpose |
|------|---------|
| `packages/core/src/types/config.ts` | Config types and `defineConfig` |
| `packages/core/src/detectors/framework.ts` | Framework detection |
| `packages/cli/src/commands/init.ts` | Init wizard |
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
