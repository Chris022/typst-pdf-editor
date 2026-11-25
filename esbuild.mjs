import esbuild from 'esbuild';

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
