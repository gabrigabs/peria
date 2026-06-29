import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/preview.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  bundle: true,
  minify: false,
  target: 'es2022',
});
