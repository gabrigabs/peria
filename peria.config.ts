import { defineConfig } from '@peria/core';

export default defineConfig({
  framework: 'other',
  entrypoint: 'packages/cli/src/index.ts',

  project: {
    name: 'Peria',
    tagline: 'Human-readable by default. LLM-ready by design.',
    description:
      'Peria compiles code, configuration, docs, and Git history into a living technical wiki with traceable claims.',
    audience:
      'Engineers maintaining a codebase and AI agents that need source-backed context before making changes.',
    tone: 'Pragmatic, source-linked, and implementation-aware.',
    problem:
      'Most generated docs flatten a repo into indexes. Peria should preserve intent, ownership boundaries, and change history.',
    currentFocus:
      'Make the repository capable of documenting itself with a useful markdown wiki, visual reader, graph artifact, and agent context map.',
    highlights: [
      'The human wiki in /docs is the source of truth.',
      'The visual reader is generated from markdown instead of a parallel content model.',
      'Agent context files point back to the same wiki tree used by humans.',
      'Git metadata is part of the generated knowledge, not an afterthought.',
    ],
    packageContexts: {
      peria: {
        role: 'Workspace orchestration root',
        audience:
          'Contributors running repo-wide build, typecheck, test, and release preparation commands.',
        responsibilities: [
          'Coordinate Bun workspaces.',
          'Expose root scripts that validate every package.',
          'Carry the self-documentation config for this repository.',
        ],
      },
      '@peria/core': {
        role: 'Knowledge engine',
        audience: 'Contributors changing extraction, graph, config, or wiki generation behavior.',
        responsibilities: [
          'Resolve configuration and defaults.',
          'Extract packages, modules, exports, commands, adapters, features, context files, and Git metadata.',
          'Generate markdown pages, manifest data, llms.txt content, and graph artifacts.',
        ],
      },
      '@peria/cli': {
        role: 'Operator interface',
        audience: 'Developers running Peria locally or wiring it into scripts.',
        responsibilities: [
          'Initialize project configuration.',
          'Build the wiki and artifacts.',
          'Serve the generated static docs locally.',
        ],
      },
      '@peria/adapters': {
        role: 'Runtime integration layer',
        audience: 'API teams embedding generated docs in framework applications.',
        responsibilities: [
          'Expose framework-specific entrypoints for Express, Fastify, and NestJS.',
          'Keep adapter contracts thin until generated artifacts are stable.',
        ],
      },
      '@peria/sdk': {
        role: 'Programmatic API surface',
        audience: 'Tools that need to call Peria without going through the CLI.',
        responsibilities: [
          'Define SDK instance contracts.',
          'Prepare for embedded server and graph/search access.',
        ],
      },
    },
  },

  docs: {
    enabled: true,
    route: '/docs',
    outputDir: 'docs',
  },

  sources: {
    markdown: ['README.md', 'CLAUDE.md', 'AGENTS.md'],
    llms: ['llms.txt'],
    context: ['CLAUDE.md', 'AGENTS.md'],
  },

  features: {
    // Implemented
    embeddedDocs: true, // CLI serve command works (adapters coming in Phase 4)
    codeMap: true, // Wiki builder extracts modules/exports
    wiki: true, // Wiki builder generates pages
    llms: true, // llms.txt generation works

    // Coming soon
    apiReference: false, // OpenAPI parsing (Phase 3)
    driftCheck: true, // Basic diagnostics (Phase 0, task 3)
    contextPacks: false, // Agent context packs (Phase 6)
    mermaid: false, // Mermaid support (Phase 7)
    embeddedDocsAdapters: false, // Express/Fastify/NestJS adapters (Phase 4)

    // Not planned for MVP
    gitDiff: false, // Git diff impact analysis
    changeMap: false, // Semantic change map
    patchNotes: false, // Changelog generation
    github: false, // GitHub integration
  },
});
