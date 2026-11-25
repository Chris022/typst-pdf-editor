import { debug_data } from "./debug-data.js";
import { Store } from "./store.js"
import { deconstruct_message } from "./util.js";

export function initWebSocket(store: Store) {
    if(store.getState().spoof_websocket == true){
        setTimeout(()=>{
                store.dispatch({ type: 'TS_RENDER', payload: Uint8Array.fromBase64(debug_data) })
        },1000);

        return;
    }
    let socket = new WebSocket(window.__TINYMIST_PROVIDER_FIXTURE__.ws);

    socket.binaryType = 'arraybuffer';

    //ToDo Handle connection error and what not!

    socket.onopen = (event) => {
        //request full resend
        socket.send("current");
    }

    socket.onmessage = (event) => {
        let [type,payload] = deconstruct_message(event.data)

        switch(type){
            case "new": store.dispatch({ type: 'TS_RENDER', payload: payload }); break;
            case "diff-v1": store.dispatch({ type: 'TS_RENDER', payload: payload }); break;
        }
    };
}