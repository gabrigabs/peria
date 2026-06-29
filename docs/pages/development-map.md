# Development Map

Use this page as the maintenance entrypoint before changing a package boundary, CLI command, adapter, or generated docs contract.

## Change Areas

| Package | Directory | Modules | Internal dependencies |
| --- | --- | --- | --- |
| peria | `.` | 0 | @peria/core, @peria/renderer |
| @peria/adapters | `packages/adapters` | 6 | none |
| @peria/api-reference | `packages/api-reference` | 2 | none |
| @peria/cli | `packages/cli` | 17 | @peria/core, @peria/renderer |
| @peria/core | `packages/core` | 118 | none |
| @peria/renderer | `packages/renderer` | 8 | @peria/core |
| @peria/sdk | `packages/sdk` | 4 | @peria/api-reference, @peria/core |

## Entrypoints

| Surface | Entries |
| --- | --- |
| CLI commands | `init`, `serve` |
| Adapters | `express`, `fastify`, `nest`, `shared`, `smoke.test` |
| Docs renderer | `fumadocs` at `docs` |

## Suggested Reading Order

- Start with `application-map` to inspect the generated aggregate.
- Use `packages` before changing public package exports or dependencies.
- Use `modules` before moving source files or changing imports.
- Use `diagrams` when dependency or module relationships are the risky part of a change.
- Use `history` to connect the current working tree to recent commits.
