import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    express: 'src/express.ts',
    fastify: 'src/fastify.ts',
    nest: 'src/nest.ts',
    hono: 'src/hono.ts',
    elysia: 'src/elysia.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
})
