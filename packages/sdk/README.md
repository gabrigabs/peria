# @peria/sdk

Deferred private package reserved for a future Peria programmatic API.

## Status

Do not publish or install this package yet. The current public integration paths are:

- `@peria/cli` for `scan`, `build`, `check`, `context`, and `diagram`
- `@peria/adapters` for serving generated docs in Express, Fastify, and NestJS
- `@peria/renderer` for Fumadocs-compatible generated output

The future SDK should be a programmatic API for scan/build/check orchestration. It should not become a framework adapter layer.

## Current Export

The package only exports `periaSdkRoadmap` so local builds can keep the workspace shape while making the deferred status explicit.

## License

MIT
