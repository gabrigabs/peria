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
| `peria github` | Diagnose auth and write local GitHub provenance cache |

### Framework Adapters ✅

Adapters for the published framework surface:

| Adapter | Status |
|---------|--------|
| Express | ✅ Works |
| Fastify | ✅ Works |
| NestJS | ✅ Works |

### Self-Documentation ✅

Peria uses itself to document Peria:
- TypeScript modules extracted with ts-morph
- **10 audit checks** for drift detection
- CLI smoke and integration tests
- Docs generated as markdown pages and Fumadocs-compatible MDX content

Run `peria build` to refresh the current module, package, command, Git, and page counts.

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

- `docs/pages/` — source-backed wiki pages
- `docs/content/docs/` — Fumadocs-compatible MDX pages
- `docs/content/docs/meta.json` — Fumadocs sidebar metadata
- `docs/source.config.ts` — Fumadocs MDX collection config
- `docs/lib/source.ts` — Fumadocs loader module
- `docs/wiki-manifest.json` — page tree
- `.peria/manifest.json` — full graph data
- `.peria/graph.json` — entity relationships
- `.peria/application-map.json` — aggregate application map
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

### 5. Diagnose GitHub Auth

```bash
peria github auth status
peria github auth login
```

Peria checks `GITHUB_TOKEN`, `.peria/github.local.json`, then `gh auth token`. Token values are never printed or written to generated artifacts.

### 6. Write GitHub Provenance Cache

```bash
peria scan
peria github cache write
```

This writes `.peria/github.json` with typed issues, pull requests, milestones, commits, and relations inferred from the manifest and local Git history. It does not call the GitHub API or persist credentials.

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
    outputDir: "docs",
    renderer: "fumadocs"
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
| [`packages/sdk`](packages/sdk/) | Deferred private programmatic API |
| [`packages/renderer`](packages/renderer/) | Fumadocs-compatible wiki renderer |
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
├── Fumadocs content (MDX + meta)
├── llms.txt (LLM consumption)
├── Context Packs (task-optimized)
└── Mermaid Diagrams
```

---

## License

MIT — see [LICENSE](LICENSE)
