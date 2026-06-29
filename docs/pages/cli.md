# CLI Commands

The CLI is the operator path through Peria. Commands are extracted from the CAC registry, then cross-checked against handler files so the wiki can distinguish usable flows from placeholders.

## Operator Journey

1. `init` creates the project configuration.
2. `build` extracts knowledge and writes `/docs`, `.eria/graph.json`, and `llms.txt`.
3. `serve` previews the generated wiki locally.
4. `check` is reserved for drift detection once a baseline model exists.

## Command Registry

| Command | Description | Status | Handler | Registry provenance |
| --- | --- | --- | --- | --- |
| init | Initialize Peria in your project | implemented | `packages/cli/src/commands/init.ts` | `packages/cli/src/index.ts:23` |
| serve | Serve documentation locally | implemented | `packages/cli/src/commands/serve.ts` | `packages/cli/src/index.ts:34` |
