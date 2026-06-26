# @peria/adapters

Framework adapters for Peria - support for NestJS, Express, Fastify, Hono, and Elysia.

## Installation

```bash
npm install @peria/adapters
```

## Usage

```typescript
import { createNestJSAdapter } from '@peria/adapters/nest';
import { createExpressAdapter } from '@peria/adapters/express';

const adapter = createNestJSAdapter({
  entrypoint: './src/main.ts',
});

const routes = await adapter.extractRoutes(context);
```

## Supported Frameworks

- **NestJS** - `createNestJSAdapter`
- **Express** - `createExpressAdapter`
- **Fastify** - `createFastifyAdapter`
- **Hono** - `createHonoAdapter`
- **Elysia** - `createElysiaAdapter`

## License

MIT
