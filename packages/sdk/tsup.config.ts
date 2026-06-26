import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/api-reference.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
});
