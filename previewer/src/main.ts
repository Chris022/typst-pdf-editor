import { initConnection, registerCallbacks } from "./communication.js"
import {init, fullRender} from "./rendering.js"
import Alpine from 'alpinejs'

//Start Alpine JS
window.Alpine = Alpine
Alpine.start()

let session_store = init();

let connection = initConnection(true);

registerCallbacks(connection,
  (payload)=>{
    fullRender(session_store,payload);
  },
  ()=>{}
);