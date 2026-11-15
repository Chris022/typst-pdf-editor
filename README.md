# typst-pdf-editor


## My findings
The frontend connects to the websocket used to exchange information on a default port and URL.
However the backend literally reads and replaces this string before serving the html.
See https://github.com/Myriad-Dreamin/tinymist/blob/main/editors/vscode/src/features/preview.ts
and search for "html.replace"