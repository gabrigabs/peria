# Configuration And Features

Peria is configured by `peria.config.ts` and resolved with defaults from `@peria/core`.

## Project Profile

- Name: Peria
- Tagline: Human-readable by default. LLM-ready by design.
- Audience: Engineers maintaining a codebase and AI agents that need source-backed context before making changes.
- Tone: Pragmatic, source-linked, and implementation-aware.
- Current focus: Make the repository capable of documenting itself with a useful markdown wiki, visual reader, graph artifact, and agent context map.

Configured highlights:

- The human wiki in /docs is the source of truth.
- The visual reader is generated from markdown instead of a parallel content model.
- Agent context files point back to the same wiki tree used by humans.
- Git metadata is part of the generated knowledge, not an afterthought.

## Resolved Project Config

- Framework: `other`
- Entrypoint: `packages/cli/src/index.ts`
- Docs route: `/docs`
- Docs output directory: `docs`
- Markdown sources: `README.md`, `CLAUDE.md`, `AGENTS.md`
- AI context files: `CLAUDE.md`, `AGENTS.md`

## Feature Flags

| Feature | State | Provenance |
| --- | --- | --- |
| apiReference | disabled | `peria.config.ts:93` |
| changeMap | disabled | `peria.config.ts:101` |
| codeMap | enabled | `peria.config.ts:88` |
| contextPacks | disabled | `peria.config.ts:95` |
| driftCheck | enabled | `peria.config.ts:94` |
| embeddedDocs | enabled | `peria.config.ts:87` |
| embeddedDocsAdapters | disabled | `peria.config.ts:97` |
| gitDiff | disabled | `peria.config.ts:100` |
| github | disabled | `peria.config.ts:103` |
| llms | enabled | `peria.config.ts:90` |
| mermaid | enabled | `peria.config.ts:96` |
| patchNotes | disabled | `peria.config.ts:102` |
| wiki | enabled | `peria.config.ts:89` |
