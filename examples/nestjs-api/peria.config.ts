import { defineConfig } from '@peria/core';

export default defineConfig({
  framework: 'nestjs',
  entrypoint: 'src/main.ts',
  project: {
    name: 'Peria NestJS API Example',
    tagline: 'A small API used to validate Peria end to end.',
    description:
      'This example shows how Peria maps NestJS routes, DTOs, OpenAPI operations, generated docs, and adapter-served wiki assets.',
    audience: 'Engineers evaluating Peria on a real backend shape.',
    problem:
      'A new user needs one small project that proves the scanner, wiki generator, drift checks, and docs adapter work together.',
    currentFocus:
      'Keep the example minimal while still exercising routes, schemas, OpenAPI, Fumadocs output, and adapter serving.',
    highlights: [
      'Routes are declared in NestJS controllers.',
      'OpenAPI source is checked against generated docs.',
      'The NestJS adapter serves the generated wiki under /docs.',
    ],
    packageContexts: {
      'peria-example-nestjs-api': {
        role: 'Example application',
        audience: 'New Peria users and release validators',
        responsibilities: [
          'Expose a small NestJS route surface.',
          'Carry OpenAPI and DTO sources for scanner coverage.',
          'Serve generated Peria docs through the NestJS adapter.',
        ],
      },
    },
  },
  docs: {
    enabled: true,
    route: '/docs',
    outputDir: 'docs',
    renderer: 'fumadocs',
  },
  sources: {
    openapi: 'openapi.yaml',
    markdown: ['README.md'],
  },
  features: {
    embeddedDocs: true,
    codeMap: true,
    apiReference: true,
    wiki: true,
    llms: true,
    driftCheck: true,
    mermaid: true,
    contextPacks: true,
  },
});
