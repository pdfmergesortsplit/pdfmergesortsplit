import { useRef, useState } from "react";

import {
  PDFMergeSortSplit,
  usePdfMergeSortSplit,
} from "@rsj-de/pdfmergesortsplit/react";

const params = new URLSearchParams(location.search);

const PLUS_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23dc2626' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M12 5v14M5 12h14'/%3E%3C/svg%3E";

// The component reads its configuration once, so the object is built once.
const config = {
  ...(params.get("embed") ? { embedUrl: params.get("embed") } : {}),
  ...(params.get("token") ? { apiKey: params.get("token") } : {}),
  title: "RSJ PDF Merge — React sample",
  ui: {
    blog: false,
    extension: false,
    language: false,
    theme: false,
  },
  actions: {
    loaders: { select: { title: "Select File", icon: PLUS_ICON } },
    // One injection point, two buttons: the event carries the configured
    // key, so each export gets its own name.
    saveAll: {
      savePdf: { title: "Export PDF" },
      saveZip: { title: "Export ZIP" },
    },
    savePart: { savePart: { title: "Save part" } },
  },
};

const saveBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

export default function App() {
  // The hook returns the editor's methods already bound to the instance, so
  // the handlers below call them directly - no ref access, no wrappers.
  const { ref, loadDocument, exportDocument, getPages } =
    usePdfMergeSortSplit();

  const fileInput = useRef(null);
  const [status, setStatus] = useState("starting…");

  const selectFile = () => {
    fileInput.current?.click();
  };

  const handleAction = async ({ action, part, reference }) => {
    if (action === "select") {
      selectFile();
      return;
    }

    try {
      setStatus("Exporting…");

      if (action === "savePdf") {
        await exportDocument(undefined, "pdf");
      }
      if (action === "saveZip") {
        await exportDocument(undefined, "zip");
      }
      if (action === "savePart") {
        await exportDocument(part ?? reference, "pdf");
      }
    } catch (error) {
      setStatus(`Export failed: ${error.message}`);
    }
  };

  const handleExport = ({ fileName, blob }) => {
    saveBlob(blob, fileName);
    setStatus(`Exported ${fileName} — ${Math.round(blob.size / 1024)} kB.`);
  };

  const handleReady = (editor) => {
    // Handy in the browser console (and for automated checks).
    window.pdfEditor = editor;
    setStatus("Editor ready.");
  };

  const handleLicense = ({ licensed, reason }) => {
    setStatus(
      licensed
        ? "Licensed for embedding."
        : `Test mode${reason ? ` (${reason})` : ""}`,
    );
  };

  // `null` hides the table; the array keeps the last pages it showed.
  const [pages, setPages] = useState(null);

  const refreshPages = async () => {
    const next = await getPages();
    setPages(next);
    return next;
  };

  const addFiles = async (files) => {
    for (const file of files) {
      setStatus(`Loading ${file.name}…`);
      await loadDocument({ name: file.name, content: file });
    }
    setStatus(`Loaded ${files.length} file(s).`);

    // Keep an open provenance table in sync with what was just added.
    if (pages) {
      await refreshPages();
    }
  };

  const handleFileChange = async (event) => {
    await addFiles([...(event.target.files ?? [])]);
    event.target.value = "";
  };

  const showPages = async () => {
    const next = await refreshPages();
    const sources = [
      ...new Set(next.map((page) => page.provenance?.source ?? "?")),
    ];
    setStatus(
      `${next.length} page(s) from ${sources.join(", ") || "nothing"}.`,
    );
  };

  const closePages = () => setPages(null);

  const saveAllZip = async () => {
    await exportDocument(undefined, "zip");
  };

  return (
    <div className="app">
      <header>
        <h1>React sample</h1>
        <button type="button" onClick={selectFile}>
          Add PDF…
        </button>
        <button type="button" onClick={showPages}>
          Show provenance
        </button>
        <button type="button" onClick={saveAllZip}>
          Save all (ZIP)
        </button>
        <span className="status">{status}</span>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={handleFileChange}
        />
      </header>

      <main>
        <PDFMergeSortSplit
          ref={ref}
          config={config}
          onAction={handleAction}
          onExport={handleExport}
          onReady={handleReady}
          onLicense={handleLicense}
        />
      </main>

      {pages && (
        <section className="provenance">
          <div className="provenance-header">
            <h2>Page provenance</h2>
            <span>
              {pages.length} page{pages.length === 1 ? "" : "s"}
            </span>
            <button type="button" onClick={closePages}>
              Close
            </button>
          </div>
          <div className="provenance-body">
            {pages.length === 0 ? (
              <p className="provenance-empty">No pages loaded yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Part</th>
                    <th>Source</th>
                    <th>Page in source</th>
                    <th>Provenance</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page, index) => (
                    <tr key={page.id ?? index}>
                      <td>{index + 1}</td>
                      <td>{page.partName || "—"}</td>
                      <td>{page.provenance?.source ?? "—"}</td>
                      <td>{page.provenance?.page ?? "—"}</td>
                      <td>
                        <code>
                          {page.provenance
                            ? JSON.stringify(page.provenance)
                            : "—"}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
