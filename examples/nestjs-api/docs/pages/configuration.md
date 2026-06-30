# Configuration And Features

Peria is configured by `peria.config.ts` and resolved with defaults from `@peria/core`.

## Project Profile

- Name: Peria NestJS API Example
- Tagline: A small API used to validate Peria end to end.
- Audience: Engineers evaluating Peria on a real backend shape.
- Tone: Direct, technical, and provenance-first.
- Current focus: Keep the example minimal while still exercising routes, schemas, OpenAPI, Fumadocs output, and adapter serving.

Configured highlights:

- Routes are declared in NestJS controllers.
- OpenAPI source is checked against generated docs.
- The NestJS adapter serves the generated wiki under /docs.

## Resolved Project Config

- Framework: `nestjs`
- Entrypoint: `src/main.ts`
- Docs route: `/docs`
- Docs output directory: `docs`
- Markdown sources: `README.md`
- AI context files: `CLAUDE.md`, `AGENTS.md`

## Feature Flags

| Feature | State | Provenance |
| --- | --- | --- |
| apiReference | enabled | `peria.config.ts:46` |
| changeMap | disabled | `packages/core/src/types/config.ts` |
| codeMap | enabled | `peria.config.ts:45` |
| contextPacks | enabled | `peria.config.ts:51` |
| driftCheck | enabled | `peria.config.ts:49` |
| embeddedDocs | enabled | `peria.config.ts:44` |
| embeddedDocsAdapters | disabled | `packages/core/src/types/config.ts` |
| gitDiff | disabled | `packages/core/src/types/config.ts` |
| github | disabled | `packages/core/src/types/config.ts` |
| llms | enabled | `peria.config.ts:48` |
| mermaid | enabled | `peria.config.ts:50` |
| patchNotes | disabled | `packages/core/src/types/config.ts` |
| wiki | enabled | `peria.config.ts:47` |
