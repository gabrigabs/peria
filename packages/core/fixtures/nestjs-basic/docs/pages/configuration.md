# Configuration And Features

Peria is configured by `peria.config.ts` and resolved with defaults from `@peria/core`.

## Project Profile

- Name: Peria
- Tagline: Human-readable by default. LLM-ready by design.
- Audience: Engineers and AI coding agents who need reliable codebase context.
- Tone: Direct, technical, and provenance-first.
- Current focus: Build a local-first self-documenting wiki pipeline before adding hosted integrations.

Configured highlights:

- Markdown wiki pages are the canonical artifact.
- llms.txt is a compact reading map derived from the human wiki.
- Every generated claim should trace back to source files, line numbers, and Git context.

## Resolved Project Config

- Framework: `other`
- Entrypoint: `src/index.ts`
- Docs route: `/docs`
- Docs output directory: `docs`
- Markdown sources: `README.md`, `docs/**/*.md`
- AI context files: `CLAUDE.md`, `AGENTS.md`

## Feature Flags

| Feature | State | Provenance |
| --- | --- | --- |
| apiReference | enabled | `packages/core/src/types/config.ts` |
| changeMap | disabled | `packages/core/src/types/config.ts` |
| codeMap | enabled | `packages/core/src/types/config.ts` |
| contextPacks | disabled | `packages/core/src/types/config.ts` |
| driftCheck | enabled | `packages/core/src/types/config.ts` |
| embeddedDocs | enabled | `packages/core/src/types/config.ts` |
| embeddedDocsAdapters | disabled | `packages/core/src/types/config.ts` |
| gitDiff | disabled | `packages/core/src/types/config.ts` |
| github | disabled | `packages/core/src/types/config.ts` |
| llms | enabled | `packages/core/src/types/config.ts` |
| mermaid | disabled | `packages/core/src/types/config.ts` |
| patchNotes | disabled | `packages/core/src/types/config.ts` |
| wiki | enabled | `packages/core/src/types/config.ts` |
