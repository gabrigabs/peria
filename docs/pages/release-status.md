# Release Status

This generated status is intentionally conservative. It reports what the current repository can prove from package manifests and generated wiki output.

## Snapshot

- Generated at: 2026-06-29T15:05:07.798Z
- Git branch: `feat/planning`
- Git commit: `7e52595050d9485dd0fdf2fd7efa7f798ad0fbf0`
- Working tree: 13 changed files
- Documentation pages: 14
- Renderer: `fumadocs`

## Package Surface

| Package | Directory | Surface | Dependencies |
| --- | --- | --- | --- |
| peria | `.` | internal or app package | 4 |
| @peria/adapters | `packages/adapters` | public surface | 10 |
| @peria/api-reference | `packages/api-reference` | public surface | 5 |
| @peria/cli | `packages/cli` | internal or app package | 9 |
| @peria/core | `packages/core` | public surface | 11 |
| @peria/renderer | `packages/renderer` | public surface | 6 |
| @peria/sdk | `packages/sdk` | public surface | 3 |

## Release Gates Still Worth Checking

- Fresh npm install outside the monorepo.
- `npm pack --dry-run` for every package intended for publication.
- A generated Fumadocs host app or documented integration harness.
- Adapter dogfood against a real NestJS app.
