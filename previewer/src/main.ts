import { initWebSocket } from "./communication.js";
import { AppState } from "./logic.js";
import { initPDFRenderer, initTSRenderer } from "./rendering.js";
import { Store } from "./store.js"
import pdfURL from "./../../examples/simple.pdf?url"
import './style.css';

const initialState: AppState = {
    spoof_websocket: true,
    viewport: {
        width: 595,
        height: 842,
        scale: 1,
        scroll: 0,
        page:0
    },
    rendering: {
        last_rendered: "NONE",
        typst_rendering_data: {
            data: null,
            is_rendering: false
        },
        pdf_rendering_data: {
            file: pdfURL,
            require_reload: true,
            pdf: null,
            is_rendering: false
        }
    }

};

const store = new Store(initialState);

initWebSocket(store);
initTSRenderer(store);
initPDFRenderer(store);

window.addEventListener("wheel", (event) => {
    let scale =  store.getState().viewport.scale;
    if(event.ctrlKey == true){
        if(event.deltaY < 0){
            store.dispatch({type:"VIEWPORT_CHANGE",viewport:{
                scale: scale + 0.4
            }});
        }
        if(event.deltaY > 0){
            if(scale - 0.4 > 0){
                store.dispatch({type:"VIEWPORT_CHANGE",viewport:{
                    scale: scale - 0.4
                }});
            }
        }
        return;
    }

    let delta_scroll = 5;
    let scroll = store.getState().viewport.scroll;
    let page = store.getState().viewport.page;

    if(event.deltaY < 0){
        //in case the scroll would now go below 0 change page instead

        if(scroll - delta_scroll < 0){
            if(page - 1 >= 0){
                store.dispatch({type:"VIEWPORT_CHANGE",viewport:{
                    scroll: 100,
                    page: page - 1
                }});
            }
        }else{
            store.dispatch({type:"VIEWPORT_CHANGE",viewport:{
                scroll: scroll - delta_scroll
            }});
        }
        
    }
    if(event.deltaY > 0){
        let scroll = store.getState().viewport.scroll;
        //in case the scroll would now go over 100 change page instead 
        if(scroll + delta_scroll > 100){
            store.dispatch({type:"VIEWPORT_CHANGE",viewport:{
                scroll: 0,
                page: page + 1
            }});
        }else{
            store.dispatch({type:"VIEWPORT_CHANGE",viewport:{
                scroll: scroll + delta_scroll
            }});
        }
    }
})

store.subscribe((state)=>{
    console.log("New state:" , state)
})