import { createTypstRenderer, RenderSession, TypstRenderer } from '@myriaddreamin/typst.ts';
import wasmBytes from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm';



const renderer = createTypstRenderer();

export async function init(): Promise<RenderSession> {
    await renderer.init({
        getModule: () => wasmBytes,
    });

    let releaseSession;
    return new Promise<RenderSession>((resolveSession, rejectSession) => {
        let sessionResolved = false;
        let releaseResolve: () => void = () => { };
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
}

export async function fullRender(session_store,payload) {
    let session = await session_store;

    renderer.manipulateData({ renderSession: session, action: `merge`, data: payload });

    let canvas = document.getElementById('preview') as HTMLCanvasElement;
    if(!canvas){
        console.log("Errror");
    }

    let context = canvas.getContext("2d");

    session.renderCanvas({
        canvas: context,
        pageOffset: 0,
        backgroundColor: "#fff"
    }) 
}