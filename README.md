[![Timestamp GIT](https://timestampgit.dev/api/statusSummary/pdfmergesortsplit/pdfmergesortsplit)](https://timestampgit.dev/status/pdfmergesortsplit/pdfmergesortsplit)
[![Timestamp GIT](https://timestampgit.dev/api/statusCount/pdfmergesortsplit/pdfmergesortsplit)](https://timestampgit.dev/status/pdfmergesortsplit/pdfmergesortsplit)
[![Timestamp GIT](https://timestampgit.dev/api/statusLast/pdfmergesortsplit/pdfmergesortsplit)](https://timestampgit.dev/status/pdfmergesortsplit/pdfmergesortsplit)
[![Timestamp GIT](https://timestampgit.dev/api/statusBadge/pdfmergesortsplit/pdfmergesortsplit)](https://timestampgit.dev/status/pdfmergesortsplit/pdfmergesortsplit)
# PDF Merge, Sort & Split SDK

Embed the editor of [pdfmerge.rsj.de](https://pdfmerge.rsj.de) in your own
product. One iframe, a small SDK, and documents that never leave the browser.

```bash
npm install @rsj-de/pdfmergesortsplit
```

```js
import { PDFMergeSortSplitClass } from '@rsj-de/pdfmergesortsplit';

const editor = new PDFMergeSortSplitClass('#editor', { apiKey: '<licence JWT>' });

await editor.whenReady();
const pdf = await editor.exportDocument();   // every page as one Blob
```

React:

```jsx
import { PDFMergeSortSplit, usePdfMergeSortSplit } from '@rsj-de/pdfmergesortsplit/react';

export function PdfEditor() {
  const { ref, exportDocument } = usePdfMergeSortSplit();

  const handleAction = async ({ action }) => {
    if (action === 'saveZip') await exportDocument(undefined, 'zip');
  };

  return <PDFMergeSortSplit ref={ref} config={{ apiKey }} onAction={handleAction} />;
}
```

## What is in here

| Path | Contents |
| --- | --- |
| [`sdk/`](sdk) | The published package: the editor class, the React component and their TypeScript types. |
| [`sdksample/`](sdksample) | React sample — the high-level API end to end (provenance table, Google Drive, exports). |
| [`sdksimple/`](sdksimple) | Plain JavaScript sample — the low-level class without a framework. |

## Documentation

- [Getting started](https://pdfmerge.rsj.de/docs/getting-started)
- [Configuration](https://pdfmerge.rsj.de/docs/configuration)
- [Low-level API](https://pdfmerge.rsj.de/docs/api-low-level) · [React](https://pdfmerge.rsj.de/docs/api-react)
- [Page provenance](https://pdfmerge.rsj.de/docs/provenance) · [Licensing](https://pdfmerge.rsj.de/docs/licensing)

## Running the samples

The samples depend on the SDK through `link:../sdk`, so build it first:

```bash
pnpm --dir sdk install --ignore-workspace
pnpm --dir sdk run build

pnpm --dir sdksimple install --ignore-workspace
pnpm --dir sdksample install --ignore-workspace

pnpm --dir sdksimple run dev     # plain JavaScript sample
pnpm --dir sdksample run dev     # React sample
```

Both embed the hosted editor by default. `?embed=http://localhost:4173` points
them at a local editor build, `?token=<jwt>` supplies a licence.

## Licence and business model

The SDK's code is **MIT-licensed** (see [LICENSE](LICENSE)): read it, fork it,
change it, ship it.

The **editor it embeds** is a subscription product. An embedded editor asks for a
licence token (`apiKey`); without a valid one it runs in **test mode** — every
feature works, a banner marks the embedding as unlicensed. Licences are per
integration and volume, not per page.

- Pricing and the licence model: <https://pdfmerge.rsj.de/docs/licensing>
- A licence: [info@rsj.de](mailto:info@rsj.de?subject=RSJ%20PDF%20Merge%20SDK%20licence)

## About this repository

It is generated: `sdk/`, `sdksample/` and `sdksimple/` are mirrored from the
product repository with every release, so commits made here are overwritten.
Please open an issue instead of a pull request.
