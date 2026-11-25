import { AppState } from "./logic";
import { Store } from "./store";
import { RenderSession, createTypstRenderer, TypstRenderer } from "@myriaddreamin/typst.ts";
import wasmBytes from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url';
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { RenderParameters } from "pdfjs-dist/types/src/display/api";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";




function initSession(releaseSession, renderer: TypstRenderer) {
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


export async function initTSRenderer(store: Store) {

    //Create renderer and connect with wasm definition
    const renderer = createTypstRenderer();
    await renderer.init({ getModule: () => wasmBytes });

    //Init session
    let releaseSession;
    let session_store = initSession(releaseSession, renderer);
    let session = await session_store;

    //Get canvas and Context
    const canvas = document.getElementById('typst-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    //The rendering functions
    async function render(state: AppState) {
        if (state.rendering_data.required == false) return;
        full_render(renderer, session, ctx, state.rendering_data.data)
    }

    store.subscribe(render);
}

export async function initPDFRenderer(store: Store) {
    GlobalWorkerOptions.workerSrc = pdfWorker;

    //Get canvas and Context
    const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    var pdf = await getDocument({ url: "https://www.fsa.usda.gov/Internet/FSA_File/tech_assist.pdf" }).promise;
    let page = await pdf.getPage(1)
    var desiredWidth = 100;
    var view = page.getViewport({ scale: 1, });
    var scale = desiredWidth / view.width;
    var scaledViewport = page.getViewport({ scale: scale, });

    await page.render({
        canvasContext: ctx,
        viewport: view
    } as RenderParameters).promise;

}

async function full_render(renderer, session, ctx, data) {

    renderer.manipulateData({ renderSession: session, action: `merge`, data: data });

    session.renderCanvas({
        canvas: ctx,
        pageOffset: 0,
        backgroundColor: "#ffffff00"
    })

}