/** Configuration the embedding page hands to the editor. */
export interface PDFMergeConfig {
  /** Where the editor is served (default `https://pdfmerge.rsj.de`). */
  embedUrl?: string;
  /** Licence JWT - removes the test-mode banner in the embedded editor. */
  apiKey?: string;
  /** Title shown in the editor's title bar. */
  title?: string;
  /** Icon (URL) that replaces ours in the title bar. */
  icon?: string;
  /** Hide parts of the editor's UI. Everything is shown by default. */
  ui?: {
    logo?: boolean;
    icon?: boolean;
    landing?: boolean;
    title?: boolean;
    about?: boolean;
    blog?: boolean;
    language?: boolean;
    extension?: boolean;
    fullscreen?: boolean;
    theme?: boolean;
    toolbar?: {
      new?: boolean;
      savePdf?: boolean;
      saveZip?: boolean;
      saveDrive?: boolean;
      print?: boolean;
      undo?: boolean;
      redo?: boolean;
      upload?: boolean;
      drive?: boolean;
      addText?: boolean;
      scaleSort?: boolean;
      pages?: boolean;
      rotate?: boolean;
      previous?: boolean;
      next?: boolean;
      delete?: boolean;
      scalePage?: boolean;
    };
    partHeader?: {
      label?: boolean;
      name?: boolean;
      pages?: boolean;
      save?: boolean;
      drive?: boolean;
      print?: boolean;
    };
  };
  /** Buttons injected into the editor; clicks arrive as "action" events. */
  actions?: {
    loaders?: Record<string, PDFMergeAction>;
    saveAll?: Record<string, PDFMergeAction>;
    savePart?: Record<string, PDFMergeAction>;
  };
  /** Write the page provenance into exported PDFs (default off). */
  provenance?: { attach?: boolean };
  /** Timeout for the initial handshake in ms (default 20000). */
  readyTimeout?: number;
}

export interface PDFMergeAction {
  title?: string;
  icon?: string;
}

export interface PDFMergePage {
  id: number;
  page: number;
  rotate: number;
  partName: string;
  provenance: unknown;
}

export interface PDFMergeActionEvent {
  /** Key of the clicked button in `config.actions` - not the injection point. */
  action: string;
  /** Injection point the button was configured in. */
  where: 'loaders' | 'saveAll' | 'savePart';
  reference?: string;
  part?: number;
}

export interface PDFMergeExportEvent {
  reference?: string | number;
  mode: 'pdf' | 'zip';
  fileName: string;
  pages: Array<{ page: number; provenance: unknown }>;
  blob: Blob;
}

export interface PDFMergeLicenseEvent {
  licensed: boolean;
  reason?: string;
}

export interface LoadDocumentOptions {
  name?: string;
  content: File | Blob | ArrayBuffer | Uint8Array | string;
  provenance?: unknown[] | object;
}

export declare class PDFMergeSortSplitClass {
  constructor(container: string | HTMLElement, config?: PDFMergeConfig);

  readonly iframe: HTMLIFrameElement;

  whenReady(): Promise<PDFMergeSortSplitClass>;
  /** Apply a new configuration to the running editor (no reload). */
  setConfig(config?: PDFMergeConfig): void;
  on(event: 'action', handler: (event: PDFMergeActionEvent) => void): () => void;
  on(event: 'export', handler: (event: PDFMergeExportEvent) => void): () => void;
  on(event: 'license', handler: (event: PDFMergeLicenseEvent) => void): () => void;
  off(event: string, handler: (event: unknown) => void): void;
  loadDocument(options: LoadDocumentOptions): Promise<unknown>;
  loadDocument(name: string, content: LoadDocumentOptions['content']): Promise<unknown>;
  getPages(): Promise<PDFMergePage[]>;
  exportDocument(reference?: string | number, mode?: 'pdf' | 'zip'): Promise<Blob>;
  destroy(): void;
}

export default PDFMergeSortSplitClass;
