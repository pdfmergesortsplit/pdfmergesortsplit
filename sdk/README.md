# @rsj-de/pdfmergesortsplit — RSJ PDF Merge, Sort & Split SDK

> The editor runs in test mode without a licence: everything works, a banner
> shows that the embedding is unlicensed. See
> [Licensing](https://pdfmerge.rsj.de/docs/licensing).

Embed the editor of <https://pdfmerge.rsj.de> in your own product. One iframe, a
small SDK, and documents that never leave the browser.

Two levels, same editor:

- **Low-level** `PDFMergeSortSplitClass` (`@rsj-de/pdfmergesortsplit`) — any framework.
- **High-level** `<PDFMergeSortSplit>` + `usePdfMergeSortSplit`
  (`@rsj-de/pdfmergesortsplit/react`) — React, built on the class.

```bash
pnpm add @rsj-de/pdfmergesortsplit
```

```js
import { PDFMergeSortSplitClass } from '@rsj-de/pdfmergesortsplit';

const editor = new PDFMergeSortSplitClass('#editor', {
  embedUrl: 'https://pdfmerge.rsj.de',   // or your self-hosted deployment
  apiKey: '<licence JWT>',                // removes the test-mode banner
  title: 'Acme Document Suite',
  ui: { toolbar: { print: false } },
  actions: {
    // Any number of buttons per injection point; the event carries the key.
    saveAll: {
      savePdf: { title: 'Export PDF' },
      saveZip: { title: 'Export ZIP' },
    },
  },
});

await editor.whenReady();
await editor.loadDocument({ name: 'contract.pdf', content: file });
const pdf = await editor.exportDocument(0, 'pdf');   // part 0 → Blob

editor.on('action', async ({ action, part }) => {
  if (action === 'savePdf') download(await editor.exportDocument(part));
  if (action === 'saveZip') download(await editor.exportDocument(undefined, 'zip'));
});
```

React:

```jsx
import { PDFMergeSortSplit, usePdfMergeSortSplit } from '@rsj-de/pdfmergesortsplit/react';

function App() {
  // The hook returns the editor's methods, bound to the instance it creates.
  const { ref, exportDocument } = usePdfMergeSortSplit();

  const handleAction = async ({ action, part }) => {
    if (action === 'savePdf') download(await exportDocument(part, 'pdf'));
  };

  const handleExport = ({ fileName, blob }) => download(blob, fileName);

  return (
    <PDFMergeSortSplit
      ref={ref}
      config={{ apiKey }}
      style={{ height: 640 }}
      onAction={handleAction}
      onExport={handleExport}
    />
  );
}
```

## API

| member | description |
|---|---|
| `new PDFMergeSortSplitClass(container, config)` | creates the iframe in `container` (element or selector) |
| `whenReady()` | resolves when the editor took the configuration |
| `setConfig(config)` | applies a new configuration to the running editor (no reload) |
| `loadDocument({name, content, provenance})` | adds a PDF (File, Blob, ArrayBuffer, base64, data URL) |
| `getPages()` | the pages with their per-page provenance |
| `exportDocument(reference?, mode?)` | one part (`"pdf"`) or everything (`"zip"`) → `Blob`; `reference` is a part index or name |
| `on("action" \| "export", handler)` | injected buttons and finished exports; returns an unsubscribe function |
| `destroy()` | removes the iframe |

## Configuration

`config` is passed to the editor as it is:

- `embedUrl` — where the editor is served (default `https://pdfmerge.rsj.de`).
- `apiKey` — the licence JWT. Without one the embedded editor shows a
  "test mode" banner and stays fully functional.
- `title`, `icon` — replace the title bar of the editor.
- `ui` — hide any combination of the title-bar and toolbar controls and the
  part-header buttons (`ui.toolbar`, `ui.partHeader`); everything is shown by
  default.
- `actions.loaders` / `actions.saveAll` / `actions.savePart` — buttons injected
  into the editor. Their clicks arrive as `on("action", …)` with
  `{action, where, reference, part}`.
- `provenance.attach` — write the page provenance into exported PDFs.

A running editor takes a new configuration with `setConfig(config)`; the React
component calls it whenever the `config` prop changes, so the open document
stays. Only a different `embedUrl` needs a new iframe.

The full schema is in `types/index.d.ts`.

## Build and publish

```bash
pnpm install --ignore-workspace     # this package is not part of the app's workspace
pnpm run build                      # dist/index.js, dist/index.cjs, dist/react.*
npm publish                         # prepublishOnly builds again
```

`react` is an optional peer dependency: the plain class does not import it.

## Samples

`../sdksimple` (plain JavaScript) and `../sdksample` (React) both use this
package through `link:../sdk`, so build the SDK before starting a sample.

The published sources live in
<https://github.com/pdfmergesortsplit/pdfmergesortsplit> (mirrored from the
product repository on every release); issues go there.
