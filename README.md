# typst-pdf-editor

This is a VSCode Plugin that works with tinymist and allows you to comment pdfs using typst.

This for now is more a proof of concept. The goal should be to first, completely get rid of the tinymist viwer, and then completely get rid of VS code and make this a seperate application

## My findings
The frontend connects to the websocket used to exchange information on a default port and URL.
However the backend literally reads and replaces this string before serving the html.
See https://github.com/Myriad-Dreamin/tinymist/blob/main/editors/vscode/src/features/preview.ts
and search for "html.replace"