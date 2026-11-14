import * as vscode from "vscode";
import { WebSocketServer } from "ws";


const TINYMIST_EXTENSION_ID = "myriad-dreamin.tinymist";


let wss: WebSocketServer | undefined;

export async function activate(context: vscode.ExtensionContext) {
  // Start a local WebSocket server on a random free port
  wss = new WebSocketServer({ port: 44441 }); //Hardcoded Port might cause Problems

  const output = vscode.window.createOutputChannel("PDFEditorPreview");

  wss.on("connection", (ws) => {
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      output.appendLine("Got command:" + msg.type);
      if (msg.type === "mouse-click") {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          editor.edit((b) => b.insert(editor.selection.active, 
            `dx: ${msg.x}pt,dy: ${msg.y}pt,`));
        }
      }
      
    });
  });

  context.subscriptions.push({
    dispose: () => wss?.close(),
  });

  return {
    providePreviewer() {
      const tinymistVersion = String(
        vscode.extensions.getExtension(TINYMIST_EXTENSION_ID)?.packageJSON.version ?? "0.0.0",
      );
      return {
        htmlPath: "previewer/index.html",
        compatibleTinymistVersion: tinymistVersion,
      };
    },
  };
}

export function deactivate() { }


