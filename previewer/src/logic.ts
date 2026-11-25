import { RenderSession } from "@myriaddreamin/typst-ts-renderer";

export type AppState = {
    spoof_websocket : Boolean,
    rendering_data: {
        required: Boolean,
        type: "Initial" | "Update",
        data: Uint8Array
    }
};

export type Action = 
    | { type: 'RENDER_INITIAL'; payload: Uint8Array }
    | { type: 'RENDER_UPDATE'; delta: Uint8Array };


export function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'RENDER_INITIAL':
            return { ...state, rendering_data: {required: true, type:"Initial",data:action.payload} };
        case 'RENDER_UPDATE':
            return { ...state, rendering_data: {required:true, type:"Update",data:action.delta} };
        default:
            return state;
    }
}