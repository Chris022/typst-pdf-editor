import * as vscode from "vscode";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const TINYMIST_EXTENSION_ID = "myriad-dreamin.tinymist";

export async function activate(context: vscode.ExtensionContext) {
  return {
    providePreviewer() {
      const tinymistVersion = String(
        vscode.extensions.getExtension(TINYMIST_EXTENSION_ID)
          ?.packageJSON.version ?? "0.0.0",
      );

      return {
        compatibleTinymistVersion: tinymistVersion,
        supportedTargets: ["paged"],

        async handlePreview(task: {
          taskId: string;
          documentUri: string;
          documentPath: string;
          dataPlaneHost: string;
          dataPlanePort: string | number;
        }) {
          const panel = vscode.window.createWebviewPanel(
            "pdfEditorPreview",
            "PDF Editor Preview",
            vscode.ViewColumn.Beside,
            {
              enableScripts: true,
              retainContextWhenHidden: true,
              localResourceRoots: [
                vscode.Uri.joinPath(context.extensionUri, "dist"),
              ],
            },
          );

          // Load your existing frontend HTML.
          let html = await fs.readFile(
            path.join(context.extensionPath, "dist", "preview.html"),
            "utf8",
          );

          // Give the frontend Tinymist's existing rendering connection.
          html = html.replace(
            "ws://127.0.0.1:23625",
            task.dataPlaneHost,
          );

          panel.webview.html = html;

          // Frontend -> extension
          panel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.type === "mouse-click") {
              const editor = vscode.window.activeTextEditor;

              if (editor) {
                await editor.edit((builder) => {
                  builder.insert(
                    editor.selection.active,
                    `dx: ${msg.x}pt,dy: ${msg.y}pt,`,
                  );
                });
              }
            }
          });

          // Extension -> frontend example:
          // await panel.webview.postMessage({ type: "hello" });

          // Tinymist calls this cleanup when the preview is disposed.
          return () => panel.dispose();
        },
      };
    },
  };
}
