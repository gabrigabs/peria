# Peria

> Human-readable by default. LLM-ready by design.

**Peria** turns your codebase into a living technical wiki. Serve it at `/docs`, keep it connected to code changes, and reuse it as high quality context for AI coding agents.

**Origin:** *peritia*, Latin for practical knowledge and expertise.

---

## Current MVP Status

### Working Features
- `peria scan` — Scan codebase for packages, routes, schemas, OpenAPI specs
- `peria build` — Generate wiki pages, llms.txt, graph
- `peria check` — Audit for drift (JSON output supported with `--json`)
- `peria context` — Generate context packs from manifest
- `peria diagram` — Generate Mermaid diagrams (route-flow, package-deps, schema)

### Available Adapters
- **Express** — `app.use('/docs', periaDocs())`
- **Fastify** — `await app.register(periaDocs, { routePrefix: '/docs' })`
- **NestJS** — `setupPeriaDocs(app, { route: '/docs' })`

### Not Yet Implemented
- Express/Fastify/NestJS embedded `/docs` adapters (in progress)
- `peria serve` — Local preview server
- `peria init` — Initialization wizard
- GitHub integration
- Git diff mapper
- Change map

---

## Quick Start

### 1. Install

```bash
npm install -D @peria/cli
```

### 2. Scan

```bash
peria scan
```

This generates `.peria/manifest.json` with your codebase structure.

### 3. Build

```bash
peria build
```

This generates:

- `docs/pages/*.md` — human-readable wiki pages
- `docs/index.html` — static visual wiki UI
- `docs/wiki-manifest.json` — page tree for the wiki
- `.peria/graph.json` — entity/claim graph
- `.peria/ai-context.md` — AI context file
- `llms.txt` — compact AI reading map

### 4. Integrate with Your Framework

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

### 5. Check for Drift

```bash
peria check

# JSON output for CI
peria check --json | jq .
```

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
    tagline: "Source-backed product and engineering knowledge.",
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
| [`packages/cli`](packages/cli/) | CLI commands: scan, build, check, context, diagram |
| [`packages/adapters`](packages/adapters/) | Express, Fastify, NestJS adapters |
| [`packages/sdk`](packages/sdk/) | Programmatic API |
| [`packages/renderer`](packages/renderer/) | Wiki UI renderer |
| [`packages/docs-ui`](packages/docs-ui/) | Docs UI components (in progress) |

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `peria scan` | Scan codebase, generate manifest |
| `peria build` | Generate wiki, llms.txt, graph |
| `peria check` | Audit for drift (`--json` for CI) |
| `peria context` | Generate context packs |
| `peria diagram` | Generate Mermaid diagrams |

---

## Architecture

```
Sources (Code, OpenAPI, Markdown)
    │
    ▼
Scanner (packages, routes, schemas)
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
```

---

## Roadmap

### MVP (Current) ✅
- [x] CLI with scan, build, check, context, diagram
- [x] Code scanning (packages, routes, schemas)
- [x] OpenAPI parsing and integration
- [x] llms.txt generation
- [x] Mermaid diagram generation
- [x] Framework adapters (Express, Fastify, NestJS)
- [ ] Context packs

### Phase 2 — Core Features
- [ ] `peria init` wizard
- [ ] `peria serve` preview server
- [ ] Wiki generator with full page navigation
- [ ] Git diff mapper
- [ ] Docs drift checker

### Phase 3 — Integrations
- [ ] GitHub sync (issues, PRs, releases)
- [ ] Change map
- [ ] Patch notes generator

---

## License

MIT — see [LICENSE](LICENSE)
