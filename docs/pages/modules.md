# TypeScript Modules

This map is extracted with `ts-morph`. It is grouped by package so the reader can see each boundary before scanning individual files.

## @peria/adapters

@peria/adapters contains 6 mapped modules and 30 exported declarations. Highest-signal files: `packages/adapters/src/index.ts`, `packages/adapters/src/elysia.ts`, `packages/adapters/src/fastify.ts`. No external source imports detected.

| Module | Exports | Imports |
| --- | --- | --- |
| `packages/adapters/src/elysia.ts` | ElysiaGroup (interface:24), ElysiaInstance (interface:19), periaDocs (function:28), PeriaDocsOptions (interface:14) | none |
| `packages/adapters/src/express.ts` | periaDocs (function:19), PeriaDocsOptions (interface:14) | none |
| `packages/adapters/src/fastify.ts` | FastifyInstance (interface:19), periaDocs (function:23), PeriaDocsOptions (interface:14) | none |
| `packages/adapters/src/hono.ts` | HonoContext (interface:18), periaDocs (function:22), PeriaDocsOptions (interface:14) | none |
| `packages/adapters/src/index.ts` | ElysiaGroup (interface:24), ElysiaInstance (interface:19), elysiaPeriaDocs (function:28), ElysiaPeriaDocsOptions (interface:14), expressPeriaDocs (function:19), ExpressPeriaDocsOptions (interface:14), FastifyInstance (interface:19), fastifyPeriaDocs (function:23), FastifyPeriaDocsOptions (interface:14), HonoContext (interface:18), honoPeriaDocs (function:22), HonoPeriaDocsOptions (interface:14), NestApplication (interface:20), PeriaNestOptions (interface:15), setupPeriaDocs (function:24) | none |
| `packages/adapters/src/nest.ts` | NestApplication (interface:20), PeriaNestOptions (interface:15), setupPeriaDocs (function:24) | none |

## @peria/cli

@peria/cli contains 11 mapped modules and 19 exported declarations. Highest-signal files: `packages/cli/src/commands/init.ts`, `packages/cli/src/prompts/features.ts`, `packages/cli/src/utils/logger.ts`. External libraries visible in source imports: `node:fs/promises`, `node:path`, `@clack/prompts`, `chalk`, `node:http`, `cac`.

| Module | Exports | Imports |
| --- | --- | --- |
| `packages/cli/src/commands/build.ts` | buildCommand (function:12) | `../utils/logger.js`, `@peria/core`, `node:fs/promises`, `node:path` |
| `packages/cli/src/commands/check.ts` | checkCommand (function:7) | `../utils/logger.js` |
| `packages/cli/src/commands/init.ts` | detectEntrypoint (function:328), detectFramework (function:313), Framework (type:4), initCommand (function:20) | `../generators/config.js`, `../prompts/entrypoint.js`, `../prompts/features.js`, `../prompts/framework.js`, `../prompts/route.js`, `../utils/logger.js`, `@clack/prompts`, `@peria/core`, `chalk` |
| `packages/cli/src/commands/serve.ts` | serveCommand (function:13) | `../utils/logger.js`, `@peria/core`, `node:fs/promises`, `node:http`, `node:path` |
| `packages/cli/src/generators/config.ts` | generateConfig (function:27), writeConfigFile (function:63) | `../prompts/features.js`, `../prompts/framework.js`, `node:fs/promises` |
| `packages/cli/src/index.ts` | none | `./commands/build.js`, `./commands/check.js`, `./commands/init.js`, `./commands/serve.js`, `cac` |
| `packages/cli/src/prompts/entrypoint.ts` | promptEntrypoint (function:10) | `@clack/prompts`, `@peria/core` |
| `packages/cli/src/prompts/features.ts` | FeatureFlags (interface:7), getFeatureSummary (function:176), promptFeatures (function:123) | `@clack/prompts` |
| `packages/cli/src/prompts/framework.ts` | DetectedFramework (type:8), promptFramework (function:28) | `@clack/prompts`, `@peria/core` |
| `packages/cli/src/prompts/route.ts` | promptDocsRoute (function:8) | `@clack/prompts`, `@peria/core` |
| `packages/cli/src/utils/logger.ts` | divider (function:43), logger (variable:7), step (function:39) | `chalk` |

## @peria/core

@peria/core contains 13 mapped modules and 113 exported declarations. Highest-signal files: `packages/core/src/index.ts`, `packages/core/src/types/wiki.ts`, `packages/core/src/types/config.ts`. External libraries visible in source imports: `node:fs/promises`, `node:path`, `node:url`, `node:child_process`, `ts-morph`.

| Module | Exports | Imports |
| --- | --- | --- |
| `packages/core/src/config/defaults.ts` | DEFAULT_DOCS (variable:32), DEFAULT_ENTRYPOINT_CANDIDATES (variable:7), DEFAULT_FEATURES (variable:17), DEFAULT_SOURCES (variable:38) | `../types/config.js` |
| `packages/core/src/config/loader.ts` | configExists (function:142), loadConfig (function:20) | `../types/config.js`, `node:fs/promises`, `node:path`, `node:url` |
| `packages/core/src/detectors/entrypoint.ts` | detectEntrypoint (function:24), getEntrypointOptions (function:36), scanForEntrypoints (function:43) | `../config/defaults.js`, `node:fs/promises`, `node:path` |
| `packages/core/src/detectors/framework.ts` | detectFramework (function:18), getFrameworkOptions (function:46) | `../types/framework.js`, `node:fs/promises`, `node:path` |
| `packages/core/src/detectors/index.ts` | detectEntrypoint (function:24), detectFramework (function:18), getEntrypointOptions (function:36), getFrameworkOptions (function:46), scanForEntrypoints (function:43) | none |
| `packages/core/src/index.ts` | AdapterSummary (interface:50), buildWiki (function:42), Claim (interface:13), CliCommandSummary (interface:34), configExists (function:142), ContextFileSummary (interface:57), DEFAULT_DOCS (variable:87), DEFAULT_ENTRYPOINT_CANDIDATES (variable:7), DEFAULT_FEATURES (variable:72), DEFAULT_PROJECT (variable:93), defineConfig (function:112), DetectedFramework (type:5), detectEntrypoint (function:24), detectFramework (function:18), DocsConfig (interface:7), Entity (interface:46), EntityType (type:23), ExportSummary (interface:21), FeatureFlags (interface:39), FeatureSummary (interface:43), Framework (type:5), FrameworkInfo (interface:13), getEntrypointOptions (function:36), getFrameworkOptions (function:46), KnowledgeGraph (interface:62), KnowledgeGraphArtifact (interface:95), LlmsSource (interface:36), loadConfig (function:20), MarkdownSource (interface:15), ModuleSummary (interface:27), OpenAPISource (interface:21), PackageContext (interface:20), PackageSummary (interface:10), parseCode (function:8), parseLlms (function:29), parseMarkdown (function:15), parseOpenAPI (function:22), PeriaConfig (interface:54), ProjectProfile (interface:27), Provenance (interface:5), ResolvedPeriaConfig (interface:63), scanForEntrypoints (function:43), SourceDocument (interface:7), SourcesConfig (interface:13), SourceType (type:5), WikiBuildResult (interface:124), WikiManifest (interface:84), WikiPage (interface:63) | none |
| `packages/core/src/parsers/index.ts` | parseCode (function:8), parseLlms (function:29), parseMarkdown (function:15), parseOpenAPI (function:22) | none |
| `packages/core/src/types/config.ts` | DEFAULT_DOCS (variable:87), DEFAULT_FEATURES (variable:72), DEFAULT_PROJECT (variable:93), defineConfig (function:112), DocsConfig (interface:7), FeatureFlags (interface:39), Framework (type:5), PackageContext (interface:20), PeriaConfig (interface:54), ProjectProfile (interface:27), ResolvedPeriaConfig (interface:63), SourcesConfig (interface:13) | none |
| `packages/core/src/types/entity.ts` | Claim (interface:13), Entity (interface:46), EntityRelation (interface:57), EntityType (type:23), KnowledgeGraph (interface:62), Provenance (interface:5) | none |
| `packages/core/src/types/framework.ts` | DetectedFramework (type:5), FRAMEWORK_LABELS (variable:27), FRAMEWORK_PACKAGES (variable:19), FrameworkInfo (interface:13) | none |
| `packages/core/src/types/source.ts` | LlmsSource (interface:36), MarkdownSource (interface:15), OpenAPIEndpoint (interface:27), OpenAPISource (interface:21), SourceDocument (interface:7), SourceType (type:5) | none |
| `packages/core/src/types/wiki.ts` | AdapterSummary (interface:50), CliCommandSummary (interface:34), ContextFileSummary (interface:57), ExportKind (type:8), ExportSummary (interface:21), FeatureSummary (interface:43), GitCommitSummary (interface:104), GitMetadata (interface:111), KnowledgeGraphArtifact (interface:95), ModuleSummary (interface:27), PackageSummary (interface:10), WikiBuildResult (interface:124), WikiManifest (interface:84), WikiManifestPage (interface:72), WikiPage (interface:63), WikiTreeSection (interface:79) | `./config.js`, `./entity.js` |
| `packages/core/src/wiki/builder.ts` | buildWiki (function:42) | `../types/config.js`, `../types/entity.js`, `../types/wiki.js`, `node:child_process`, `node:fs/promises`, `node:path`, `ts-morph` |

## @peria/docs-ui

@peria/docs-ui contains 1 mapped modules and 2 exported declarations. Highest-signal files: `packages/docs-ui/src/index.ts`. No external source imports detected.

| Module | Exports | Imports |
| --- | --- | --- |
| `packages/docs-ui/src/index.ts` | docsUI (variable:8), renderDocs (function:17) | none |

## @peria/sdk

@peria/sdk contains 3 mapped modules and 11 exported declarations. Highest-signal files: `packages/sdk/src/types.ts`, `packages/sdk/src/index.ts`, `packages/sdk/src/server/embed.ts`. No external source imports detected.

| Module | Exports | Imports |
| --- | --- | --- |
| `packages/sdk/src/index.ts` | createServer (function:5), PeriaInstance (interface:64), PeriaOptions (interface:59) | none |
| `packages/sdk/src/server/embed.ts` | createServer (function:5) | none |
| `packages/sdk/src/types.ts` | FeatureFlags (interface:44), Framework (type:5), PackageContext (interface:25), PeriaConfig (interface:7), PeriaInstance (interface:64), PeriaOptions (interface:59), ProjectProfile (interface:32) | none |

