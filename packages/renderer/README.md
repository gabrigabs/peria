# @peria/renderer

Static wiki renderer for Peria documentation.

Currently generates a self-contained static HTML wiki. Future versions will support Fumadocs integration.

## Installation

```bash
npm install @peria/renderer
```

## Usage

```typescript
import { createPeriaRenderer } from '@peria/renderer';

const renderer = createPeriaRenderer({
  manifest: manifest,
  outputDir: './docs',
});
```

## License

MIT
