# @peria/renderer

Static wiki renderer for Peria documentation.

Currently generates a self-contained static HTML wiki with support for both static and Fumadocs output modes via the CLI.

## Installation

```bash
npm install @peria/renderer
```

## Usage

The renderer is typically used through the CLI:

```bash
# Generate static HTML wiki
peria build

# Generate Fumadocs-compatible MDX content
peria build --renderer fumadocs
```

Or programmatically:

```typescript
import { renderWikiAssets, generateFumadocsContent } from '@peria/renderer';

// For static HTML
const { html, css, js } = renderWikiAssets({
  manifest: manifest,
  pages: pages,
  graph: graph,
  llmsText: llmsText,
});

// For Fumadocs
const fumadocsOutput = generateFumadocsContent({
  manifest: manifest,
  baseUrl: '/docs',
});
```

## License

MIT
