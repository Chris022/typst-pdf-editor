import { createTypstRenderer, RenderSession, TypstRenderer } from '@myriaddreamin/typst.ts';
import wasmBytes from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm';
import Alpine from 'alpinejs'
 
window.Alpine = Alpine
Alpine.start()

const renderer = createTypstRenderer();

var ws = new WebSocket("ws://127.0.0.1:23625")

const enc = new TextEncoder();
const dec = new TextDecoder();

let canvas = null as null | HTMLCanvasElement;

let releaseSession;
let session_store;

window.addEventListener("load", async () => {

  canvas = document.getElementById('preview-canvas') as HTMLCanvasElement;

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

  if (!canvas) {
    console.log("Canvas not Found");
    return
  }


  if (message_type == "new") {
    let session = await session_store;

    renderer.manipulateData({ renderSession: session, action: `merge`, data: payload });

    let context = canvas.getContext("2d");

    session.renderCanvas({
        canvas: context,
        pageOffset: 0,
        backgroundColor: "#fff"
    }) 

  }

  if (message_type == "diff-v1") {

    let session = await session_store;

    renderer.manipulateData({ renderSession: session, action: `merge`, data: payload });
  }
};

window.onclose= () => {
  releaseSession();
}