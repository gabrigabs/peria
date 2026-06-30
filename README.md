# Peria

> Human-readable by default. LLM-ready by design.

**Peria** turns your backend codebase into a living technical wiki. Scan packages, routes, schemas, OpenAPI specs, Git history, and local roadmap data; generate source-backed docs, diagrams, agent context, and drift checks.

**Origin:** *peritia*, Latin for practical knowledge and expertise.

---

## What Ships Today

Peria is ready for beta-style use on real repositories, with a narrow public surface and explicit limits.

### Shipped

| Command | Description |
|---------|-------------|
| `peria scan` | Scan codebase for packages, routes, schemas, OpenAPI specs |
| `peria build` | Generate wiki pages, Fumadocs content, llms.txt, graph, application map |
| `peria check` | Audit for drift with 10 checks (`--json` for CI) |
| `peria context` | Generate context packs for agents |
| `peria diagram` | Generate Mermaid diagrams |
| `peria github` | Diagnose auth, write provenance cache, and draft drift issues |

Peria also ships:

- Express, Fastify, and NestJS docs adapters through `@peria/adapters`
- Fumadocs-compatible generated content through `@peria/renderer`
- A bundled preview app used by `peria serve`
- Cache-first GitHub provenance pages from `.peria/github.json`
- CI-friendly pack checks and fresh-install dogfood scripts

### Roadmap, Not Stable API Yet

- `@peria/sdk` is private/deferred until the programmatic contract is dogfooded.
- `@peria/api-reference` is private/deferred until API reference rendering is a product decision, not a placeholder.
- Hono, Elysia, and other adapters are not part of the published adapter surface yet.
- Live GitHub issue/PR synchronization is still evolving. The shipped GitHub Map is generated from the local cache, local Git history, and TASKS-derived roadmap records.
- Route/schema/OpenAPI extraction depends on available source conventions. Peria reports missing coverage instead of pretending it found more than it can prove.

### Self-Documentation

Peria uses itself to document this repository:

- TypeScript modules extracted with ts-morph
- **10 audit checks** for drift detection
- CLI smoke and integration tests
- Docs generated as markdown pages and Fumadocs-compatible MDX content
- GitHub Map generated from commits, roadmap issues, milestones, and inferred relations
- Release Status page generated from package manifests and wiki output

Run `peria build` to refresh the current module, package, command, Git, and page counts.

![Peria generated wiki preview](docs/assets/peria-wiki-preview.png)

---

## When To Use Peria

Use Peria when:

- You want source-backed architecture docs that can be regenerated.
- You need a wiki that agents can read through `llms.txt`, context packs, and structured manifests.
- You want release and documentation drift checks in CI.
- You want a local application map before investing in a heavier developer portal.
- You need docs that stay close to code, package manifests, Git commits, and roadmap records.

Peria is not a replacement for API gateways, observability platforms, or full developer portals. It is a local-first documentation and provenance layer that can feed those systems later.

---

## Quick Start

### 1. Install

```bash
npm install -D @peria/cli
```

### 2. Scan & Build

```bash
npx peria scan
npx peria build --renderer fumadocs
npx peria serve
```

This generates:

- `docs/pages/` — source-backed wiki pages
- `docs/content/docs/` — Fumadocs-compatible MDX pages
- `docs/content/docs/meta.json` — Fumadocs sidebar metadata
- `docs/wiki-manifest.json` — page tree
- `.peria/manifest.json` — full graph data
- `.peria/graph.json` — entity relationships
- `.peria/application-map.json` — aggregate application map
- `.peria/github.json` — optional GitHub provenance cache
- `.peria/ai-context.md` — AI context file
- `.peria/context/` — agent context packs
- `.peria/diagrams/` — Mermaid diagrams
- `llms.txt` — compact AI reading map

### 3. Example Output

The Peria repo currently dogfoods the generated wiki. A generated Release Status page looks like this:

```text
Documentation pages: 16
Renderer: fumadocs
Claim provenance: all generated claims have source provenance
Public package exports: ready
Adapter placeholders: ready
Route coverage: reported as missing when no routes are present
```

A generated GitHub Map page includes:

```text
Issues: TASKS-derived roadmap records and drift issues
Milestones: roadmap milestone progress
Commits: recent local Git history
Relations: entity_changed_by_commit and issue_belongs_to_milestone
```

### 4. Try The End-To-End Example

The main public example is [`examples/nestjs-api`](examples/nestjs-api/). It includes NestJS routes, DTO/schema source, OpenAPI, generated docs, and the NestJS docs adapter.

```bash
cd examples/nestjs-api
npm install
npm run peria:scan
npm run peria:build
npm run peria:scan
npm run peria:check
npm run build
npm start
```

From the monorepo, the same example is validated with local packed Peria packages:

```bash
bun run example:nest
```

### 5. Integrate

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

### 6. Check for Drift

```bash
npx peria check

# JSON output for CI
npx peria check --json | jq .

# Only errors
npx peria check --json --severity error
```

### 7. Diagnose GitHub Auth

```bash
npx peria github auth status
npx peria github auth login
```

Peria checks `GITHUB_TOKEN`, `.peria/github.local.json`, then `gh auth token`. Token values are never printed or written to generated artifacts.

### 8. Write GitHub Provenance Cache

```bash
npx peria scan
npx peria github cache write
```

This writes `.peria/github.json` with typed issues, pull requests, milestones, commits, and relations inferred from the manifest and local Git history. It does not call the GitHub API or persist credentials.

### 9. Draft Drift Issues

```bash
npx peria github issues create-from-check --label team-docs
npx peria build --renderer fumadocs
```

This runs the same checks as `peria check`, deduplicates findings by fingerprint, and stores open issue records in `.peria/github.json`. When the cache exists, `peria build` adds a GitHub Issues page to the generated wiki.

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

| Package | Public status | Description |
|---------|---------------|-------------|
| [`packages/core`](packages/core/) | Published | Engine: types, config, scanners, parsers, generators |
| [`packages/cli`](packages/cli/) | Published | CLI commands and `peria` binary |
| [`packages/adapters`](packages/adapters/) | Published | Express, Fastify, NestJS middleware |
| [`packages/renderer`](packages/renderer/) | Published | Fumadocs-compatible wiki renderer and preview app |
| [`packages/sdk`](packages/sdk/) | Private / deferred | Programmatic API, not a stable public contract yet |
| [`packages/api-reference`](packages/api-reference/) | Private / deferred | API reference integration, not part of the beta publish surface |

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
├── GitHub Map (cache-first provenance)
└── Mermaid Diagrams
```

---

## Limitations

- Peria is still `0.x`; breaking changes can happen between minor releases.
- Generated claims are only as complete as the source files Peria can scan.
- GitHub pages are cache-first. Live PR/issue synchronization is not a stable public workflow yet.
- The preview app is intended for local generated docs, not as a hosted documentation platform by itself.
- `peria init` is still interactive and needs stronger automated coverage before being treated as a primary onboarding path.
- The beta publish surface is `@peria/core`, `@peria/cli`, `@peria/renderer`, and `@peria/adapters`.

---

## License

MIT — see [LICENSE](LICENSE)
