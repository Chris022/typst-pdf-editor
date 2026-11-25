import { PDFDocumentProxy } from "pdfjs-dist";

type Layer = 'NONE' | 'PDF' | 'TYPST';

export type AppState = {
    spoof_websocket : boolean,
    viewport: {
        width: number,
        height: number,
        scale: number
    },
    rendering: {
        last_rendered : Layer
        pdf_rendering_data: {
            file: string,
            require_reload: boolean,
            pdf: PDFDocumentProxy | null,
            is_rendering: boolean
        },
        typst_rendering_data: {
            data: Uint8Array|null,
            is_rendering: boolean
        },
    }
   
};

export type Action = 
    | { type: 'TS_RENDER'; payload: Uint8Array }
    | { type: 'PDF_LOADED'; pdf: PDFDocumentProxy }
    | { type: 'VIEWPORT_CHANGE_SIZE'; width: number, height: number }
    | { type: 'VIEWPORT_CHANGE_SCALE', delta: number}
    | { type: 'PDF_RENDERED'}
    | { type: 'TS_RENDERED'}
    | { type: 'TS_SET_RENDERING', rendering: boolean}
    | { type: 'PDF_SET_RENDERING', rendering: boolean};



export function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'TS_RENDER':
            return { ...state, rendering: {...state.rendering,
                last_rendered: "PDF", //FORCE RE-RENDER ONLY ON TYPST
                typst_rendering_data: {...state.rendering.typst_rendering_data, data:action.payload} 
            }};
        case 'PDF_LOADED':
            return { ...state, rendering: {...state.rendering,
                last_rendered: "NONE", //FORCE RE-RENDER ON ALL
                pdf_rendering_data: {
                    ...state.rendering.pdf_rendering_data,
                    require_reload: false,
                    pdf: action.pdf,
                }
            }};
        case 'VIEWPORT_CHANGE_SIZE':
            return { ...state, 
                rendering: {
                    ...state.rendering,
                    last_rendered: "NONE",
                },
                viewport : {...state.viewport,height:action.height,width:action.width}};
        case 'VIEWPORT_CHANGE_SCALE':
            //A viewport change also needs to trigger a rerender
            return  { ...state, 
                rendering: {
                    ...state.rendering,
                    last_rendered: "NONE",
                },
                viewport : {...state.viewport,scale:state.viewport.scale + action.delta}
            };
        case 'PDF_RENDERED':
            return { ...state, rendering: {...state.rendering,last_rendered:"PDF", pdf_rendering_data: {...state.rendering.pdf_rendering_data, is_rendering: false }}};
        case 'TS_RENDERED':
            return { ...state, rendering: {...state.rendering,last_rendered:"TYPST", typst_rendering_data: {...state.rendering.typst_rendering_data, is_rendering: false }}};
        case 'PDF_SET_RENDERING':
            return { ...state, rendering:{...state.rendering, pdf_rendering_data: {...state.rendering.pdf_rendering_data,is_rendering: action.rendering }}};
        case 'TS_SET_RENDERING':
            return { ...state, rendering: {...state.rendering, typst_rendering_data: {...state.rendering.typst_rendering_data,is_rendering: action.rendering }}};
        default:
            return state;
    }
}