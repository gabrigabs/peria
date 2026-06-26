import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/config/loader.ts', 'src/detectors/index.ts', 'src/build/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  // ts-morph uses dynamic require internally, so we keep it external
  external: ['ts-morph', 'typescript'],
});
