import { initWebSocket } from "./communication.js";
import { AppState } from "./logic.js";
import { initPDFRenderer, initTSRenderer } from "./rendering.js";
import { Store } from "./store.js"
import './style.css';

const initialState: AppState = {
    spoof_websocket: true,
    rendering_data: {
        required: false,
        type: "Initial",
        data: new Uint8Array()
    }
};

const store = new Store(initialState);

initWebSocket(store);
initTSRenderer(store);
initPDFRenderer(store);

store.subscribe((state)=>{
    console.log("New state:" , state)
})