# Peria

> Human-readable by default. LLM-ready by design.

**Peria** turns your codebase into a living technical wiki. Serve it at `/docs`, keep it connected to code changes, and reuse it as high-quality context for AI coding agents.

**Origin:** *peritia*, Latin for practical knowledge and expertise.

---

## Features

### Core
- **Embedded `/docs`** — Serve documentation at `/docs` in your own API
- **Code Map** — Maps routes, handlers, controllers, schemas, DTOs, modules
- **API Reference** — Reads OpenAPI specs and connects endpoints to code
- **Wiki Generator** — Generates technical wiki from Markdown + code knowledge

### Output
- **llms.txt** — LLM-readable output for AI agents
- **Mermaid Support** — Preserve and render Mermaid diagrams

### Analysis
- **Git Diff Mapper** — Identifies impacted files, routes, and docs from changes
- **Change Map** — Transforms diffs into semantic changes
- **Docs Drift Checker** — Detects outdated documentation
- **Patch Notes Generator** — Creates changelogs from commits and issues

### Integration
- **GitHub Integration** — Connects issues, PRs, milestones, releases
- **Context Packs** — Generates context by route, diff, PR, issue, release

---

## Quick Start

### 1. Initialize

```bash
bunx @peria/cli init
```

The wizard will:
- Detect your framework (NestJS, Express, Fastify, Hono, Elysia)
- Detect your entrypoint
- Ask for the docs route (default: `/docs`)
- Select features to enable

### 2. Build

```bash
bun run peria build
```

The build generates:

- `docs/pages/*.md` — human-readable wiki pages
- `docs/index.html` — static visual wiki that reads the generated markdown
- `docs/wiki-manifest.json` — page tree for the wiki UI
- `.eria/graph.json` — serializable entity/claim graph with provenance
- `llms.txt` — compact AI reading map derived from the human wiki

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
    description: "A technical wiki generated from code, docs, config, and Git history.",
    audience: "Engineers and AI agents working in this repository.",
    tone: "Pragmatic, source-linked, and implementation-aware.",
    problem: "Important context is spread across code, docs, config, and Git history.",
    currentFocus: "Keep the generated wiki useful for humans first.",
    packageContexts: {
      "@my/api": {
        role: "Application runtime",
        responsibilities: ["Owns HTTP endpoints", "Connects framework adapters"]
      }
    }
  },

  docs: {
    enabled: true,
    route: "/docs",
    outputDir: "docs"
  },

  sources: {
    openapi: "openapi.yaml",
    markdown: ["README.md", "docs/**/*.md"],
    llms: ["llms.txt"],
    context: ["CLAUDE.md", "AGENTS.md"]
  },

  features: {
    embeddedDocs: true,
    codeMap: true,
    apiReference: true,
    wiki: true,
    llms: true,
    gitDiff: true,
    driftCheck: true,
    mermaid: true,
    // optional:
    github: false,
    contextPacks: false,
    patchNotes: false,
    changeMap: false
  }
})
```

---

## Packages

This monorepo contains:

| Package | Description |
|---------|-------------|
| [`packages/core`](packages/core/) | Engine principal — types, config, detectors |
| [`packages/cli`](packages/cli/) | CLI com comandos init, build, serve, check |
| [`packages/sdk`](packages/sdk/) | SDK para uso programático |
| [`packages/adapters`](packages/adapters/) | Adapters Express, Fastify, NestJS, Hono, Elysia |
| [`packages/docs-ui`](packages/docs-ui/) | UI da documentação (planejado) |

---

## Architecture

```
Sources (Markdown, OpenAPI, Code, Git)
    │
    ▼
Documents (Normalized representation)
    │
    ▼
Entities + Claims
├── Entity: endpoint, service, page, ADR, issue, PR, function
├── Claim: verifiable statement + provenance + confidence
    │
    ▼
Graph (versioned relationships)
├── Nodes: Entities + Claims
└── Edges: implements, deprecates, relates_to, changed_by
    │
    ▼
Artifacts
├── Wiki pages (Markdown, navigable)
├── llms.txt (LLM consumption)
├── Context Packs (task-optimized bundles)
└── Diff reports (change impact)
```

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `peria init` | Initialize Peria in your project |
| `peria build` | Parse code, generate wiki, generate llms.txt |
| `peria serve` | Local preview of generated docs |
| `peria check` | Detect drift since last build |
| `peria diff` | Analyze changes between commits *(planned)* |
| `peria context` | Generate context pack for AI agent *(planned)* |
| `peria notes` | Generate patch notes *(planned)* |

---

## Status

**Early development.** MVP in progress — Roadmap below.

### Phase 1 — MVP
- [x] CLI setup with `init` wizard
- [x] Initial self-wiki build (`/docs`, `.eria/graph.json`, `llms.txt`)
- [x] Initial code map (packages, CLI commands, modules, exports, adapters, config)
- [ ] Route/controller/schema parsing
- [ ] OpenAPI integration
- [x] llms.txt generation from the human wiki map
- [ ] Embedded /docs in Express/Fastify

### Phase 2 — Core Features
- [ ] Wiki generator
- [ ] Git diff mapper
- [ ] Docs drift checker
- [ ] Change map

### Phase 3 — Integrations
- [ ] GitHub sync (issues, PRs, releases)
- [ ] Context packs
- [ ] Patch notes generator

---

## License

MIT — see [LICENSE](LICENSE)
