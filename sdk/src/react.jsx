import React, { forwardRef, useCallback, useEffect, useRef } from 'react';

import { PDFMergeSortSplitClass } from './index.js';

/**
 * The editor's methods, bound to the instance the component creates.
 *
 * ```jsx
 * const { ref, loadDocument, exportDocument, getPages } = usePdfMergeSortSplit();
 *
 * const handleAction = async ({ action }) => {
 *   if (action === 'saveZip') download(await exportDocument(undefined, 'zip'));
 * };
 *
 * <PDFMergeSortSplit ref={ref} config={{ apiKey }} onAction={handleAction} />
 * ```
 *
 * The returned functions are stable, so callers need no `useCallback` or
 * `useMemo` wrapper; `ref` is only needed for the escape hatches
 * (`whenReady`, `on`, `destroy`) and to pass to the component.
 */
export const usePdfMergeSortSplit = () => {
  const ref = useRef(null);

  const loadDocument = useCallback(
    (document) => ref.current.loadDocument(document),
    [],
  );
  const exportDocument = useCallback(
    (reference, mode) => ref.current.exportDocument(reference, mode),
    [],
  );
  const getPages = useCallback(() => ref.current.getPages(), []);

  return { ref, loadDocument, exportDocument, getPages };
};

/**
 * The editor as a React component.
 *
 * The iframe is created once and lives for the lifetime of the component:
 * changing `onAction` / `onExport` / `onReady` does not reload it, and a new
 * `config` is applied to the running editor (`setConfig`) instead of rebuilding
 * it, so the open document stays. Only a different `config.embedUrl` needs a
 * new iframe, which the component creates itself.
 */
export const PDFMergeSortSplit = forwardRef(function PDFMergeSortSplit(
  { config, style, className, onAction, onExport, onLicense, onReady },
  ref,
) {
  const container = useRef(null);
  const instance = useRef(null);
  const handlers = useRef({ onAction, onExport, onLicense, onReady });
  handlers.current = { onAction, onExport, onLicense, onReady };

  // The effect that creates the iframe needs the config of the render it runs
  // in, but must not re-run for every new config object.
  const configRef = useRef(config);
  configRef.current = config;

  // What the running editor already knows. `config={{ … }}` is a new object on
  // every render, so the comparison is by content, not by reference.
  const applied = useRef(null);

  // `embedUrl` is the iframe's src: only that needs a new iframe.
  const embedUrl = config?.embedUrl;

  useEffect(() => {
    const current = configRef.current;
    const created = new PDFMergeSortSplitClass(container.current, current);
    instance.current = created;
    applied.current = JSON.stringify(current ?? {});

    if (ref) {
      ref.current = created;
    }

    created
      .whenReady()
      .then((ready) => handlers.current.onReady?.(ready))
      .catch(() => {
        // `ready` rejects when the editor never answers; onReady is not called.
      });

    const offAction = created.on('action', (payload) =>
      handlers.current.onAction?.(payload),
    );
    const offExport = created.on('export', (payload) =>
      handlers.current.onExport?.(payload),
    );
    const offLicense = created.on('license', (payload) =>
      handlers.current.onLicense?.(payload),
    );

    return () => {
      offAction();
      offExport();
      offLicense();
      created.destroy();
      instance.current = null;

      if (ref) {
        ref.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedUrl]);

  // Everything except `embedUrl` is applied to the running editor, so a config
  // change does not reload the iframe and the open document stays.
  useEffect(() => {
    const current = instance.current;
    if (!current) {
      return;
    }

    const json = JSON.stringify(config ?? {});
    if (json === applied.current) {
      return;
    }
    applied.current = json;

    current.setConfig(config);
  }, [config]);

  return (
    <div
      ref={container}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
});

export { PDFMergeSortSplitClass } from './index.js';
export default PDFMergeSortSplit;
