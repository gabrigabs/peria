# AI Context Map

This map is tuned for Engineers maintaining a codebase and AI agents that need source-backed context before making changes.

Tone: Pragmatic, source-linked, and implementation-aware.

Agents should treat the human wiki as the durable knowledge layer. `llms.txt` is intentionally short: it points to the page tree and configured context files instead of duplicating the full wiki.

## Current Git Context

- Branch: `feat/self-documentation-bootstrap`
- Commit: `b3813e1e4129bc9e733e0f372e814efea49e82ef`
- Working tree: 4 changed files

## Reading Order

1. `docs/pages/overview.md`
2. `docs/pages/configuration.md`
3. `docs/pages/packages.md`
4. `docs/pages/cli.md`
5. `docs/pages/modules.md`
6. `docs/pages/history.md`

## Configured Context Files

| File | Status | Detected heading |
| --- | --- | --- |
| `CLAUDE.md` | present | CLAUDE.md |
| `AGENTS.md` | present | AGENTS.md |
