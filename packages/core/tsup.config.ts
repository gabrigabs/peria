import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/config/loader.ts', 'src/detectors/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
})
