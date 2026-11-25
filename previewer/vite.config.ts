import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: '../node_modules/pdfjs-dist/wasm',
          dest: 'typst-webview-assets/wasm', // copied WASM
          rename: { stripBase: true }
        }
      ],
    }),
  ],
  build: {
    outDir: "./../out/previewer",
    emptyOutDir: true,
    assetsDir: 'typst-webview-assets/assets',
    target: 'esnext', // Ensures modern JS features are supported
  },
});