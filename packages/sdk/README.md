# @peria/sdk

Embedded Peria server SDK for integrating documentation into your application.

## Installation

```bash
npm install @peria/sdk
```

## Usage

```typescript
import { createPeriaServer } from '@peria/sdk';

const server = createPeriaServer({
  port: 3000,
  manifest: manifest,
});

await server.start();
```

## License

MIT
