# Peria

> Human-readable by default. LLM-ready by design.

**Peria** turns your backend codebase into a living technical wiki. Scan routes, schemas, and packages → generate docs, diagrams, and agent context → detect drift automatically.

**Origin:** *peritia*, Latin for practical knowledge and expertise.

---

## Status

### CLI Commands ✅

| Command | Description |
|---------|-------------|
| `peria scan` | Scan codebase for packages, routes, schemas, OpenAPI specs |
| `peria build` | Generate wiki pages, llms.txt, graph |
| `peria check` | Audit for drift with 10 checks (`--json` for CI) |
| `peria context` | Generate context packs for agents |
| `peria diagram` | Generate Mermaid diagrams |

### Framework Adapters ✅

All adapters serve static files + manifest + llms.txt:

| Adapter | Status |
|---------|--------|
| Express | ✅ Works |
| Fastify | ✅ Works |
| NestJS | ✅ Works |

### Self-Documentation ✅

Peria uses itself to document Peria:
- **153 TypeScript modules** extracted with ts-morph
- **10 audit checks** for drift detection
- **21 CLI tests** (smoke + integration)
- Docs generated at `docs/pages/`

*Note: Numbers reflect current state and may vary with updates.*

---

## Quick Start

### 1. Install

```bash
npm install -D @peria/cli
```

### 2. Scan & Build

```bash
peria scan
peria build
```

This generates:

- `docs/pages/` — wiki pages
- `docs/index.html` — visual wiki UI
- `docs/wiki-manifest.json` — page tree
- `.peria/manifest.json` — full graph data
- `.peria/graph.json` — entity relationships
- `.peria/ai-context.md` — AI context file
- `.peria/context/` — agent context packs
- `.peria/diagrams/` — Mermaid diagrams
- `llms.txt` — compact AI reading map

### 3. Integrate

```ts
// Express
import { periaDocs } from '@peria/adapters/express'
app.use('/docs', periaDocs())

// Fastify
import { periaDocs } from '@peria/adapters/fastify'
await app.register(periaDocs, { routePrefix: '/docs' })

// NestJS
import { setupPeriaDocs } from '@peria/adapters/nest'
setupPeriaDocs(app, { route: '/docs' })
```

### 4. Check for Drift

```bash
peria check

# JSON output for CI
peria check --json | jq .

# Only errors
peria check --json --severity error
```

---

## Drift Checks

Peria runs 10 audit checks:

| Check | Description |
|-------|-------------|
| `route-openapi` | Routes without OpenAPI (error) |
| `docs-routes` | Docs referencing non-existent routes |
| `manifest-state` | Stale manifest detection |
| `package-exports` | Package export drift |
| `stale-pages` | Generated pages out of sync |
| `stale-openapi` | OpenAPI spec changes |
| `git-diff` | Git changes affecting docs |
| `schema-coverage` | Undefined schema references |
| `openapi-docs` | OpenAPI ops without docs |
| `routes-undocumented` | Routes without documentation |

---

## Configuration

```ts
// peria.config.ts
import { defineConfig } from "@peria/core"

export default defineConfig({
  framework: "nestjs",
  entrypoint: "src/main.ts",

  project: {
    name: "My API",
    tagline: "Source-backed engineering knowledge.",
  },

  docs: {
    enabled: true,
    route: "/docs",
    outputDir: "docs"
  },

  sources: {
    openapi: "openapi.yaml",
    markdown: ["README.md", "docs/**/*.md"],
  },

  features: {
    embeddedDocs: true,
    codeMap: true,
    apiReference: true,
    wiki: true,
    llms: true,
    gitDiff: false,
    driftCheck: true,
    mermaid: true,
    github: false,
    contextPacks: true,
  }
})
```

---

## Packages

| Package | Description |
|---------|-------------|
| [`packages/core`](packages/core/) | Engine — types, config, scanners, parsers, generators |
| [`packages/cli`](packages/cli/) | CLI commands |
| [`packages/adapters`](packages/adapters/) | Express, Fastify, NestJS middleware |
| [`packages/sdk`](packages/sdk/) | Programmatic API |
| [`packages/renderer`](packages/renderer/) | Wiki UI renderer |
| [`packages/api-reference`](packages/api-reference/) | Stoplight Elements integration |

---

## Architecture

```
Sources (Code, OpenAPI, Markdown)
    │
    ▼
Scanner (packages, routes, schemas, modules)
    │
    ▼
Manifest (.peria/manifest.json)
    │
    ▼
Generators
├── Wiki pages (Markdown)
├── llms.txt (LLM consumption)
├── Context Packs (task-optimized)
└── Mermaid Diagrams
    │
    ▼
Adapters (serve docs at /docs)
```

---

## License

MIT — see [LICENSE](LICENSE)
