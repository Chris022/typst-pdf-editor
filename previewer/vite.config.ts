import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    outDir: "./../out/previewer",
    target: 'esnext', // Ensures modern JS features are supported
  },
});