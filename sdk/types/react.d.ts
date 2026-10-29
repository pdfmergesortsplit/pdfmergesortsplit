import type { CSSProperties, RefObject } from 'react';

import type {
  PDFMergeActionEvent,
  PDFMergeConfig,
  PDFMergeExportEvent,
  PDFMergeLicenseEvent,
  PDFMergePage,
  PDFMergeSortSplitClass,
} from './index.js';

export interface PDFMergeSortSplitProps {
  config?: PDFMergeConfig;
  style?: CSSProperties;
  className?: string;
  onAction?: (event: PDFMergeActionEvent) => void;
  onExport?: (event: PDFMergeExportEvent) => void;
  onLicense?: (event: PDFMergeLicenseEvent) => void;
  onReady?: (editor: PDFMergeSortSplitClass) => void;
}

export declare const PDFMergeSortSplit: React.ForwardRefExoticComponent<
  PDFMergeSortSplitProps & React.RefAttributes<PDFMergeSortSplitClass | null>
>;

export declare function usePdfMergeSortSplit(): {
  ref: RefObject<PDFMergeSortSplitClass | null>;
  loadDocument: (
    document:
      | { name?: string; content: File | Blob | ArrayBuffer | Uint8Array | string; provenance?: unknown[] | object }
      | string,
    content?: File | Blob | ArrayBuffer | Uint8Array | string,
  ) => Promise<unknown>;
  exportDocument: (reference?: string | number, mode?: 'pdf' | 'zip') => Promise<Blob>;
  getPages: () => Promise<PDFMergePage[]>;
};

export { PDFMergeSortSplitClass } from './index.js';
export default PDFMergeSortSplit;
