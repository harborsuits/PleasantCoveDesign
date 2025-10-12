import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'PCD',
      fileName: (format) => format === 'umd' ? 'pcd-embed.umd.cjs' : `pcd-embed.${format}.js`,
      formats: ['es','umd']
    },
    rollupOptions: {
      output: { inlineDynamicImports: true }
    }
  }
});

