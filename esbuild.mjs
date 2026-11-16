import esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';

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


const result = await esbuild.build({
  entryPoints: ['previewer/src/main.ts'],
  bundle: true,
  platform: 'browser',
  format: 'iife',        // no import/export; safe as a classic inline script
  write: false,          // don't emit main.js
  minify: !isProduction,
  sourcemap: isProduction ? 'inline' : false,
  loader: {
  '.wasm': 'binary', // This loads the file as a Uint8Array
  },
});

const js = result.outputFiles[0].text

const html = readFileSync('previewer/index.html', 'utf8')
  .replace('<!-- INJECT_SCRIPT -->', `<script nonce="__NONCE__">${js}</script>`);


mkdirSync(`${outFolder}/previewer`, { recursive: true });
writeFileSync(`${outFolder}/previewer/index.html`, html);