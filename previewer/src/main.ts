import { createTypstRenderer, RenderSession, TypstRenderer } from '@myriaddreamin/typst.ts';
import { ManipulateDataOptions, RenderInSessionOptions, RenderOptions, RenderToCanvasOptions } from '@myriaddreamin/typst.ts/dist/esm/options.render.mjs';
import wasmBytes from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm';


const renderer = createTypstRenderer();

var ws = new WebSocket("ws://127.0.0.1:23625")

const enc = new TextEncoder();
const dec = new TextDecoder();

let canvas = null as null | HTMLCanvasElement;
let div = null as null | HTMLElement;

let releaseSession;
let session_store;

window.addEventListener("load", async () => {

  canvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
  div = document.getElementById('preview-div') as HTMLElement;

  await renderer.init({
    getModule: () => wasmBytes,
  });

 session_store = new Promise<RenderSession>((resolveSession, rejectSession) => {
      let sessionResolved = false;
      let releaseResolve: () => void = () => {};
      const releasePromise = new Promise<void>((resolve) => {
        releaseResolve = resolve;
      });
      releaseSession = releaseResolve;

      renderer.runWithSession(async (session) => {
        sessionResolved = true;
        resolveSession(session);
        await releasePromise;
      });
    });
})

ws.binaryType = 'arraybuffer';

ws.onopen = () => {
  console.log('Connected to Tinymist data plane');

  // Request a full frame immediately upon connection.
  ws.send("current");
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

  const payload = bytes.slice(message_idx + 1);

  console.log(message_type);

  if (!div || !canvas) {
    console.log("Canvas not Found");
    return
  }


  if (message_type == "new") {
    let session = await session_store;

    renderer.manipulateData({ renderSession: session, action: `merge`, data: payload });

    renderer.renderToCanvas({
        container: div,
        renderSession: session
    }) 

  }

  if (message_type == "diff-v1") {

    let session = await session_store;

    renderer.manipulateData({ renderSession: session, action: `merge`, data: payload });

    renderer.renderToCanvas({
        container: div,
        renderSession: session
    })
  }
};

window.onclose= () => {
  releaseSession();
}