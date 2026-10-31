# @rsj-de/pdfmergesortsplit

Embed the PDF editor of [pdfmerge.rsj.de](https://pdfmerge.rsj.de) in your own
product: merging, sorting, rotating, splitting and exporting PDFs inside one
iframe, with the documents never leaving the browser.

**Website:** <https://pdfmerge.rsj.de> · **Documentation:**
<https://pdfmerge.rsj.de/docs> · **Source and samples:**
<https://github.com/pdfmergesortsplit/pdfmergesortsplit> · **Licence:** MIT
([LICENSE](LICENSE))

## Features

- **Merge** any number of PDFs, or ZIP archives containing PDFs.
- **Sort** pages by drag & drop, including multi-selection (Ctrl/Cmd+click,
  Shift+click a range); rotate, duplicate and delete one page or a whole
  selection; undo/redo on every edit.
- **Split** into parts: every part has a title line, an editable name used as
  the file name, and its own save and print button. Pages can be moved between
  parts, also with the keyboard.
- **Export** one PDF per part, one merged PDF, or a ZIP of all parts — from your
  own buttons or from the editor's.
- **Page provenance**: every page keeps the source file and page it came from;
  a source can bring its own provenance, it can be written into exported PDFs,
  and it is restored when such a PDF is imported again.
- **Google Drive**: open a file from Drive's "Open with" menu, browse Drive in
  the editor's own dialog, and save the result back to Drive.
- **Your branding**: replace the title and icon, hide any control, inject your
  own buttons into three injection points and receive their clicks as events.
- **Your product's look**: light and dark theme, a page viewer, seven languages.
- **Nothing uploaded**: PDFs are parsed, edited and rebuilt in the visitor's
  browser; no document reaches a server.
- **Two levels**: a framework-agnostic class and a React component with a hook.

## Business model

The **code** of this SDK is MIT-licensed (see [LICENSE](LICENSE)): read it, fork
it, change it, ship it.

The **editor it embeds** is a subscription product. An embedded editor asks for a
licence token (`apiKey`); without a valid one it runs in **test mode** — every
feature works, a banner marks the embedding as unlicensed. Licences are per
integration and volume, not per page.

- Pricing and the licence model: <https://pdfmerge.rsj.de/docs/licensing>
- A licence: [info@rsj.de](mailto:info@rsj.de?subject=RSJ%20PDF%20Merge%20SDK%20licence)

## Install

```bash
npm install @rsj-de/pdfmergesortsplit
```

`react` is an optional peer dependency: the plain class does not import it.

## Quick start

```js
import { PDFMergeSortSplitClass } from '@rsj-de/pdfmergesortsplit';

const editor = new PDFMergeSortSplitClass('#editor', {
  apiKey: '<licence JWT>',              // test mode without one
  title: 'Acme Document Suite',
  actions: {
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

export function PdfEditor({ apiKey }) {
  const { ref, exportDocument } = usePdfMergeSortSplit();

  const handleAction = async ({ action, part }) => {
    if (action === 'savePdf') download(await exportDocument(part, 'pdf'));
  };

  return (
    <PDFMergeSortSplit
      ref={ref}
      config={{ apiKey }}
      style={{ height: 640 }}
      onAction={handleAction}
    />
  );
}
```

More, including the configuration reference, the events and the provenance
model: <https://pdfmerge.rsj.de/docs>.

## API

| Member | Description |
| --- | --- |
| `new PDFMergeSortSplitClass(container, config)` | Creates the editor in `container` (element or selector). |
| `whenReady()` | Resolves when the editor took the configuration. |
| `setConfig(config)` | Applies a new configuration to the running editor (no reload). |
| `loadDocument({name, content, provenance})` | Adds a PDF (File, Blob, ArrayBuffer, base64, data URL), optionally with per-page provenance. |
| `getPages()` | The pages in screen order, each with its provenance. |
| `exportDocument(reference?, mode?)` | One part (`"pdf"`, by index or name) or everything (`"zip"`) → `Blob`. |
| `on("action" \| "export" \| "license", handler)` | Injected buttons, finished exports, licence state; returns an unsubscribe function. |
| `destroy()` | Removes the editor and rejects pending requests. |

## Configuration

- `apiKey` — the licence token; without one the editor runs in test mode.
- `embedUrl` — where the editor is served (default `https://pdfmerge.rsj.de`,
  or your self-hosted deployment).
- `title`, `icon` — replace the title bar of the editor.
- `ui` — hide any combination of the title-bar, toolbar and part-header controls.
- `actions.loaders` / `actions.saveAll` / `actions.savePart` — buttons injected
  into the editor; their clicks arrive as `on("action", …)` with
  `{action, where, reference, part}`.
- `provenance.attach` — write the page provenance into exported PDFs.
- `googleClientId` — OAuth client ID of your own Google Cloud project for the
  Drive integration (see <https://pdfmerge.rsj.de/docs/google-drive>).

A running editor takes a new configuration with `setConfig(config)`; the React
component calls it whenever the `config` prop changes, so the open document
stays. Only a different `embedUrl` needs a new iframe. The full schema is in
`types/index.d.ts`.

## Samples

`../sdksimple` (plain JavaScript) and `../sdksample` (React) use this package
through `link:../sdk`, so build the SDK before starting a sample:

```bash
pnpm --dir sdk install --ignore-workspace
pnpm --dir sdk run build
pnpm --dir sdksimple install --ignore-workspace && pnpm --dir sdksimple run dev
pnpm --dir sdksample install --ignore-workspace && pnpm --dir sdksample run dev
```

## Build and publish

```bash
pnpm install --ignore-workspace     # this package is not part of the app's workspace
pnpm run build                      # dist/index.js, dist/index.cjs, dist/react.*
npm publish                         # prepublishOnly builds again
```

## Licence

MIT — see [LICENSE](LICENSE). The MIT licence covers this SDK's code; operating
the embedded editor requires a subscription as described under
[Business model](#business-model).
