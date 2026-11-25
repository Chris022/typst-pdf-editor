import { AppState } from "./logic";
import { Store } from "./store";
import { RenderSession, createTypstRenderer, TypstRenderer } from "@myriaddreamin/typst.ts";
import wasmBytes from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url';
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { RenderParameters } from "pdfjs-dist/types/src/display/api";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

import "pdfjs-dist/wasm/jbig2_nowasm_fallback.js";


const PAGE_SPACING = 10;

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

        //Set renderer data
        await renderer.manipulateData({ renderSession: session, action: `merge`, data: state.rendering.typst_rendering_data.data });

        //In order to allow for scrolling we need to create a new canvas here
        //Create two buffers for redering our pdf
        let buffer_1 = new OffscreenCanvas(state.viewport.width,state.viewport.height);
        let buffer_ctx_1 = buffer_1.getContext("2d");
        let buffer_2 = new OffscreenCanvas(state.viewport.width,state.viewport.height);
        let buffer_ctx_2 = buffer_2.getContext("2d");

        //We now render the first page to this new canvas
        await session.renderCanvas({
            canvas: buffer_ctx_1 as unknown as CanvasRenderingContext2D,
            pageOffset: state.viewport.page,
            pixelPerPt: state.viewport.scale,
            backgroundColor: "#7bee648e"
        }).catch((error:Error)=>{
            //Check if caused by missing page - in this case ignore
            if(error.message.match("MissingPage").length != 0){
                //Do nothing
            }
        })
        await session.renderCanvas({
            canvas: buffer_ctx_2 as unknown as CanvasRenderingContext2D,
            pageOffset: state.viewport.page+1,
            pixelPerPt: state.viewport.scale,
            backgroundColor: "#7bee648e"
        }).catch((error:Error)=>{
            //Check if caused by missing page - in this case ignore
            if(error.message.match("MissingPage").length != 0){
                //Do nothing
            }
        })

        //update canvas size - Call this as close before drawing as possible
        // Because it triggers emptying of canvas this might cause flickering
        canvas.width = state.viewport.width;
        canvas.height = state.viewport.height;
        container.style.width = state.viewport.width + "";
        container.style.height = state.viewport.height + "";

        ctx.drawImage(buffer_1,0,-state.viewport.scroll/100 * state.viewport.height);
        ctx.drawImage(buffer_2,0,PAGE_SPACING + Math.floor(state.viewport.height-(state.viewport.scroll/100 * state.viewport.height)));

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
        var pdf = await getDocument(
            {
                wasmUrl: './typst-webview-assets/wasm/',
                url:  state.rendering.pdf_rendering_data.file})
            .promise;
        
        store.dispatch({ type: 'PDF_LOADED', pdf: pdf })
    }

    async function render_pdf(state: AppState){
        if(state.rendering.last_rendered != "NONE") return;
        if (state.rendering.pdf_rendering_data.is_rendering == true) return;
        if(state.rendering.pdf_rendering_data.pdf == null) return;
        store.dispatch({type:"PDF_SET_RENDERING",rendering: true})

        let first_page = await state.rendering.pdf_rendering_data.pdf.getPage(state.viewport.page+1);
        let second_page = await state.rendering.pdf_rendering_data.pdf.getPage(state.viewport.page+2);

        var first_viewport = first_page.getViewport({scale: state.viewport.scale});

        //For now assume every page has the same size!
        var second_viewport = first_viewport;

        //Only do if size needs updating to avoid infinite loop
        if(state.viewport.width != first_viewport.width || state.viewport.height != first_viewport.height){
            store.dispatch({type:"VIEWPORT_CHANGE",viewport:{
                width:first_viewport.width,height:first_viewport.height
            }})
        }

        //Create two buffers for redering our pdf
        let buffer_1 = new OffscreenCanvas(first_viewport.width,first_viewport.height);
        let buffer_ctx_1 = buffer_1.getContext("2d");
        let buffer_2 = new OffscreenCanvas(second_viewport.width,second_viewport.height);
        let buffer_ctx_2 = buffer_2.getContext("2d");

        await first_page.render({
            canvasContext: buffer_ctx_1 as unknown as CanvasRenderingContext2D,
            viewport: first_viewport
        }as RenderParameters).promise;

        await second_page.render({
            canvasContext: buffer_ctx_2 as unknown as CanvasRenderingContext2D,
            viewport: second_viewport
        }as RenderParameters).promise;


        //update canvas size - Call this as close before drawing as possible
        // Because it triggers emptying of canvas this might cause flickering
        canvas.width = first_viewport.width;
        canvas.height = first_viewport.height;
        container.style.width = first_viewport.width + "";
        container.style.height = first_viewport.height + "";

        //And now draw them onto the real canvas. This was we don't get flickering 
        ctx.drawImage(buffer_1,0,-state.viewport.scroll/100 * state.viewport.height);
        
        ctx.drawImage(buffer_2,0,PAGE_SPACING + Math.floor(state.viewport.height-(state.viewport.scroll/100 * state.viewport.height)));

        store.dispatch({type:"PDF_RENDERED"});
    }

    store.subscribe(reload_pdf)
    store.subscribe(render_pdf)
}