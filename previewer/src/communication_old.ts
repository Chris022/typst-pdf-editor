import {debug_data} from "./debug-data"

type Connection = {
    debug : Boolean;
    ws : WebSocket | null;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

export function initConnection(debug=false): Connection{

    let ws = new WebSocket(window.__TINYMIST_PROVIDER_FIXTURE__.ws);

    ws.binaryType = 'arraybuffer';

    let connection = {
        debug: debug,
        ws: ws
    };

    ws.addEventListener("error",()=>{
        console.log("Some Error occurred - entering debug mode");
        connection.debug = false;
    })
    ws.addEventListener("open",()=>{
        //On open, request full resend
        ws.send("current");
    })

    return connection;
}

export function registerCallbacks(connection: Connection, init, update){
    if(connection.debug){
        //Handle Debug
        setTimeout(()=>{
            init(Uint8Array.fromBase64(debug_data));
        },1000)

        return;
    }

    connection.ws.addEventListener("message",(event: MessageEvent)=>{
        if (typeof event.data === 'string') {
            console.log('Control message:', event.data);
            return;
        }

        const buffer = event.data as ArrayBuffer;
        const bytes = new Uint8Array(buffer);

        const message_idx = bytes.indexOf(enc.encode(",")[0]);

        const message_type = dec.decode(bytes.slice(0, message_idx).buffer);

        const payload = bytes.slice(message_idx + 1);

        console.log(payload.toBase64())
    
        console.log(message_type);

        if(message_type == "new"){
            init(payload);
        }else if(message_type == "diff-v1"){
            update(payload);
        }
    })
}