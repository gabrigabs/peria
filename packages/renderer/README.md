# @peria/renderer

Fumadocs-compatible renderer for Peria documentation.

The renderer converts Peria wiki pages into MDX content, sidebar metadata, and Fumadocs source configuration.

## Installation

```bash
npm install @peria/renderer
```

## Usage

The renderer is typically used through the CLI:

```bash
peria build
```

Or programmatically:

```typescript
import { generateFumadocsContent } from '@peria/renderer';

const fumadocsOutput = generateFumadocsContent({
  manifest: manifest,
  pages: pages,
  baseUrl: '/docs',
});
```

## License

MIT
