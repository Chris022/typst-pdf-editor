import { initWebSocket } from "./communication.js";
import { AppState } from "./logic.js";
import { initPDFRenderer, initTSRenderer } from "./rendering.js";
import { Store } from "./store.js"
import './style.css';

const initialState: AppState = {
    spoof_websocket: true,
    viewport: {
        width: 595,
        height: 842,
        scale: 2
    },
    rendering: {
        last_rendered: "NONE",
        typst_rendering_data: {
            data: null,
            is_rendering: false
        },
        pdf_rendering_data: {
            file: "https://www.freeprintablepdf.eu/files/papers/en-colored-paper-red-a4.pdf",
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
    if(event.ctrlKey == false) return;
    if(event.deltaY < 0){
        store.dispatch({type:"VIEWPORT_CHANGE_SCALE",delta: 0.4})
    }
    if(event.deltaY > 0){
        store.dispatch({type:"VIEWPORT_CHANGE_SCALE",delta: -0.4})
    }
})

store.subscribe((state)=>{
    console.log("New state:" , state)
})