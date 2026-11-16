import { createTypstRenderer } from '@myriaddreamin/typst.ts';
import { ManipulateDataOptions, RenderInSessionOptions, RenderOptions, RenderToCanvasOptions } from '@myriaddreamin/typst.ts/dist/esm/options.render.mjs';
import wasmBytes from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm';


const renderer = createTypstRenderer();

var ws = new WebSocket("ws://127.0.0.1:23625")

const enc = new TextEncoder();
const dec = new TextDecoder();

let container = null as null | HTMLElement;


window.addEventListener("load", async () => {

  container = document.getElementById('preview-canvas') as HTMLElement;

  await renderer.init({
    getModule: () => wasmBytes,
  });

  // Request a full frame immediately upon connection.
  ws.send("current");

})

ws.binaryType = 'arraybuffer';

ws.onopen = () => {
  console.log('Connected to Tinymist data plane');
};

ws.onmessage = async (event: MessageEvent) => {
  if (typeof event.data === 'string') {
    // Handle JSON control messages (e.g., status updates)
    console.log('Control message:', event.data);
    return;
  }

  const buffer = event.data as ArrayBuffer;
  const bytes = new Uint8Array(buffer);

  const message_idx = bytes.indexOf(enc.encode(",")[0]);

  const message_type = dec.decode(bytes.slice(0, message_idx).buffer);

  const data = bytes.slice(message_idx + 1);

  console.log(message_type);

  if (!container) {
    console.log("Canvas not Found");
    return
  }

  if (message_type == "new") {
      await renderer.renderToCanvas({
        container: container, 
        artifactContent: data,
        format: 'vector',
        pixelPerPt: 6,
        backgroundColor: '#ffffff' } as RenderOptions<RenderToCanvasOptions>);

      // Get rid of weird transform that is added by renderToCanvas
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      if(canvas.parentElement){
        canvas.parentElement.style = "none"
      }
  }
};