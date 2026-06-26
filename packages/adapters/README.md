# @peria/adapters

Framework adapters for Peria - support for NestJS, Express, and Fastify.

## Installation

```bash
npm install @peria/adapters
```

## Usage

```typescript
import express from 'express';
import { periaDocs } from '@peria/adapters/express';

const app = express();
app.use('/docs', periaDocs({ docsPath: 'docs' }));
```

```typescript
import { setupPeriaDocs } from '@peria/adapters/nest';

setupPeriaDocs(app, { route: '/docs', docsPath: 'docs' });
```

## Supported Frameworks

- **NestJS** - `setupPeriaDocs`
- **Express** - `periaDocs`
- **Fastify** - `periaDocs`
## License

MIT
