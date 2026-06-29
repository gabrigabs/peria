# Known Gaps

This page separates generated fact from roadmap intent so the wiki does not overclaim product maturity.

| Area | Current state |
| --- | --- |
| Route coverage | No routes are present in the latest scan manifest. |
| Schema coverage | No schemas are present in the latest scan manifest. |
| OpenAPI coverage | No OpenAPI operations are present in the latest scan manifest. |
| API routes | No routes are present in the application map. Run `peria scan` on a framework fixture or app with route extraction enabled. |
| Schemas | No schemas are present in the application map. DTO/schema extraction still needs broader dogfood. |
| OpenAPI | No OpenAPI operations are present. Configure `sources.openapi` or keep this marked as unavailable. |
| Fumadocs preview tarball | The preview app is bundled locally; the next release still needs `dogfood:npm` validation against the published tarball. |
| GitHub sync | Issue cache and auth exist, but PR/milestone synchronization still needs a live GitHub-backed flow. |

## Practical Impact

- Package, module, CLI, adapter, history, diagram, and docs-page knowledge is available in this build.
- Route, schema, and OpenAPI completeness depends on a current scan manifest with those entities.
- Public adoption still needs published-package dogfood, docs drift CI, and live GitHub milestone synchronization.
