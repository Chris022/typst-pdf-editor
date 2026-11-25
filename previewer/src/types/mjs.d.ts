
declare module '*.mjs?url' {
  // If using esbuild-plugin-wasm: it exports a default module object.
  // If using esbuild's 'binary' loader: it exports a Uint8Array.
  const content: any; // Use a more specific type if known
  export default content;
}