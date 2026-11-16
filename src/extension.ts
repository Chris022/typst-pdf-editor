import * as vscode from "vscode";

const TINYMIST_EXTENSION_ID = "chris.typst-pdf-editor";

export async function activate(_context: vscode.ExtensionContext) {
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

export function deactivate() {}
