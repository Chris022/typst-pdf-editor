import esbuild from 'esbuild';
import { singleHtmlPlugin } from "esbuild-single-html";

const isProduction = process.argv.includes('--production');
const outFolder = "out";


await esbuild.build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  platform: 'node',
  outfile: `${outFolder}/extension.js`,
  external: ['vscode'], // VS Code API is provided by the host
  minify: isProduction,
  sourcemap: !isProduction,
});

await esbuild.build({
  entryPoints: ['previewer/index.html'],
  outfile: `${outFolder}/previewer/index.html`,
  bundle: true,
  minify: true,
  plugins: [
    singleHtmlPlugin()
  ],
  loader: {
  '.wasm': 'binary', // This loads the file as a Uint8Array
  },
});
