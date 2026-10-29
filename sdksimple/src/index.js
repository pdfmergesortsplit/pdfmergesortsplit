/**
 * Plain JavaScript sample: the editor as an iframe, driven through the SDK.
 *
 * `?embed=http://localhost:4173` points it at a local build of the app,
 * `?token=<jwt>` supplies a licence.
 */
import { PDFMergeSortSplitClass } from "@rsj-de/pdfmergesortsplit";

const params = new URLSearchParams(location.search);
const status = document.querySelector("#status");
const fileInput = document.querySelector("#file");

const say = (text) => {
  status.textContent = text;
};

/** A small icon for the injected "select" button. */
const PLUS_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23dc2626' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M12 5v14M5 12h14'/%3E%3C/svg%3E";

const saveBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

const config = {
  ...(params.get("embed") ? { embedUrl: params.get("embed") } : {}),
  ...(params.get("token") ? { apiKey: params.get("token") } : {}),
  title: "RSJ PDF Merge — plain JavaScript sample",
  ui: {
    blog: false,
    extension: false,
    language: false,
    theme: false,
  },
  actions: {
    loaders: {
      select: { title: "Select File", icon: PLUS_ICON },
    },
    // Two buttons in one injection point: the event carries the key, not the
    // injection point, so both exports live here.
    saveAll: {
      savePdf: { title: "Export PDF" },
      saveZip: { title: "Export ZIP" },
    },
    savePart: {
      savePart: { title: "Save part" },
    },
  },
};

const editor = new PDFMergeSortSplitClass("#editor", config);

// Handy in the browser console (and for automated checks).
window.pdfEditor = editor;

editor.on("license", ({ licensed, reason }) => {
  say(licensed ? "Licensed for embedding." : `Test mode${reason ? ` (${reason})` : ""}`);
});

editor.on("export", ({ fileName, blob }) => {
  saveBlob(blob, fileName);
  say(`Exported ${fileName} — ${Math.round(blob.size / 1024)} kB.`);
});

editor.on("action", async ({ action, reference, part }) => {
  if (action === "select") {
    fileInput.click();
    return;
  }

  try {
    say("Exporting…");

    if (action === "savePdf") {
      await editor.exportDocument(undefined, "pdf");
    }
    if (action === "saveZip") {
      await editor.exportDocument(undefined, "zip");
    }
    if (action === "savePart") {
      await editor.exportDocument(part ?? reference, "pdf");
    }
  } catch (error) {
    say(`Export failed: ${error.message}`);
  }
});

const addFiles = async (files) => {
  for (const file of files) {
    say(`Loading ${file.name}…`);
    await editor.loadDocument({ name: file.name, content: file });
  }
  say(`Loaded ${files.length} file(s).`);
};

fileInput.addEventListener("change", async () => {
  try {
    await addFiles([...(fileInput.files ?? [])]);
  } finally {
    fileInput.value = "";
  }
});

document.querySelector("#pick").addEventListener("click", () => fileInput.click());

document.querySelector("#pages").addEventListener("click", async () => {
  const pages = await editor.getPages();
  const sources = [...new Set(pages.map((page) => page.provenance?.source ?? "?"))];
  say(`${pages.length} page(s) from ${sources.join(", ") || "nothing"}.`);
});

document.querySelector("#save-all").addEventListener("click", async () => {
  try {
    say("Exporting…");
    await editor.exportDocument(undefined, "zip");
  } catch (error) {
    say(`Export failed: ${error.message}`);
  }
});

editor
  .whenReady()
  .then(() => say("Editor ready."))
  .catch((error) => say(`The editor did not start: ${error.message}`));
