# @peria/renderer

Static wiki renderer for Peria documentation using Fumadocs.

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
