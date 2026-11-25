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
    const container = document.getElementById("canvas-container") as HTMLDivElement;
    const canvas = document.getElementById('typst-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    //The rendering functions
    async function render(state: AppState) {
        if (state.rendering.last_rendered != "PDF") return;
        if (state.rendering.typst_rendering_data.is_rendering == true) return;
        if (state.rendering.typst_rendering_data.data == null) return;
        store.dispatch({type:"TS_SET_RENDERING",rendering: true})

        canvas.width = state.viewport.width;
        canvas.height = state.viewport.height;
        container.style.width = state.viewport.width + "";
        container.style.height = state.viewport.height + "";
        

        await renderer.manipulateData({ renderSession: session, action: `merge`, data: state.rendering.typst_rendering_data.data });

        await session.renderCanvas({
            canvas: ctx,
            pageOffset: 0,
            pixelPerPt: state.viewport.scale,
            backgroundColor: "#ffffff00"
        })

        store.dispatch({type:"TS_RENDERED"})
    }

    store.subscribe(render);
}

export async function initPDFRenderer(store: Store) {
    GlobalWorkerOptions.workerSrc = pdfWorker;

    //Get canvas and Context
    const container = document.getElementById("canvas-container") as HTMLDivElement;
    const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    async function reload_pdf(state: AppState){
        if(state.rendering.pdf_rendering_data.require_reload == false) return;
        var pdf = await getDocument({ url:  state.rendering.pdf_rendering_data.file}).promise;

        store.dispatch({ type: 'PDF_LOADED', pdf: pdf })
    }

    async function render_pdf(state: AppState){
        if(state.rendering.last_rendered != "NONE") return;
        if (state.rendering.pdf_rendering_data.is_rendering == true) return;
        if(state.rendering.pdf_rendering_data.pdf == null) return;
        store.dispatch({type:"PDF_SET_RENDERING",rendering: true})

        let page = await state.rendering.pdf_rendering_data.pdf.getPage(1);

        var viewport = page.getViewport({scale: state.viewport.scale});

        //Update page size.
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        container.style.width = viewport.width + "";
        container.style.height = viewport.height + "";
        

        //Only do if size needs updating to avoid infinite loop
        if(state.viewport.width != viewport.width || state.viewport.height != viewport.height){
            store.dispatch({type:"VIEWPORT_CHANGE_SIZE",width:viewport.width,height:viewport.height})
        }

        await page.render({
            canvasContext: ctx,
            viewport: viewport
        } as RenderParameters).promise;

        store.dispatch({type:"PDF_RENDERED"})
    }

    store.subscribe(reload_pdf)
    store.subscribe(render_pdf)
}