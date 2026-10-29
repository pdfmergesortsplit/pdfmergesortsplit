/**
 * RSJ PDF Merge, Sort & Split - SDK
 *
 * The editor runs in an iframe (hosted by RSJ, or by you when self-hosting).
 * This class owns that iframe and the postMessage protocol between the two:
 *
 *   app  -> host   {op: "init", version}            the editor is up
 *   host -> app    {op: "initRsp", config}          title, icon, hidden UI, actions, apiKey
 *   app  -> host   {op: "licenseRequest"}           framed and not licensed yet: asks for a licence
 *   host -> app    {op: "licenseRsp", token}        the licence (config.apiKey), or no token
 *   app  -> host   {op: "licenseStatus", licensed, reason}   the verdict
 *   host -> app    {op: "addFiles", data}           File/Blob/base64/data URL  -> addFilesRsp
 *   host -> app    {op: "addPages", name, content, provenance}                 -> addPagesRsp
 *   host -> app    {op: "pages"}                                                -> pagesRsp
 *   host -> app    {op: "export", mode, part|reference}                         -> exportRsp
 *   app  -> host   {op: "action", action, where, reference, part}  a button the host configured
 *
 * `action` is the key of the button in `config.actions`, `where` the injection
 * point it was configured in; an injection point holds any number of buttons.
 *
 * Every request carries an `id` that the answer echoes, so concurrent calls do
 * not get mixed up.
 */

const DEFAULT_EMBED_URL = 'https://pdfmerge.rsj.de';
const DEFAULT_TIMEOUT = 20000;

/** Requests whose payload is the document itself, not options. */
const isBinary = (value) =>
  (typeof Blob !== 'undefined' && value instanceof Blob) ||
  value instanceof ArrayBuffer ||
  ArrayBuffer.isView(value);

export class PDFMergeSortSplitClass {
  /**
   * @param {string|HTMLElement} container element (or selector) that receives the iframe
   * @param {object} config `{ embedUrl, apiKey, title, icon, ui, actions, provenance, … }`
   */
  constructor(container, config = {}) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;

    if (!element) {
      throw new Error(`pdfmerge: container not found: ${String(container)}`);
    }

    this.config = config ?? {};
    this.embedUrl = String(this.config.embedUrl || DEFAULT_EMBED_URL).replace(/\/+$/, '');
    this.origin = new URL(this.embedUrl).origin;
    this.handlers = new Map();
    this.pending = new Map();
    this.requestId = 0;
    this.readyDone = false;
    this.destroyed = false;

    this.iframe = document.createElement('iframe');
    this.iframe.src = `${this.embedUrl}/`;
    this.iframe.title = 'PDF Merge, Sort & Split';
    this.iframe.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen');
    this.iframe.setAttribute('allowfullscreen', 'true');
    this.iframe.style.cssText = 'display:block;width:100%;height:100%;border:0';
    element.appendChild(this.iframe);

    this.handleMessage = (event) => this.receive(event);
    window.addEventListener('message', this.handleMessage);

    const timeout = this.config.readyTimeout ?? DEFAULT_TIMEOUT;
    this.ready = new Promise((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
      this.readyTimer = setTimeout(() => {
        reject(new Error(`pdfmerge: the editor did not answer within ${timeout} ms`));
      }, timeout);
    });
    // Nobody has to await it; an unhandled rejection would only be noise.
    this.ready.catch(() => {});
  }

  /** Resolves once the editor has taken our configuration. */
  whenReady() {
    return this.ready;
  }

  /**
   * Replace the configuration on the running editor.
   *
   * The editor applies it immediately - title, icon, hidden controls, injected
   * buttons, provenance and the licence token - without reloading the iframe.
   * `embedUrl` is the exception: it is the iframe's `src`, so changing it needs
   * a new iframe (the React component does that for you).
   */
  setConfig(config = {}) {
    this.config = config ?? {};
    this.send({ op: 'config', config: this.config });
  }

  /** Subscribe to "action" / "export"; returns an unsubscribe function. */
  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event).add(handler);

    return () => this.off(event, handler);
  }

  /** Remove a handler added with `on`. */
  off(event, handler) {
    this.handlers.get(event)?.delete(handler);
  }

  /**
   * Add a PDF to the editor.
   *
   * `loadDocument({name, content, provenance})` or `loadDocument(name, content)`.
   * `content` may be a File, a Blob, an ArrayBuffer, a Uint8Array, base64 or a
   * data URL; `provenance` is one entry per page (any JSON).
   */
  async loadDocument(nameOrOptions, content, provenance) {
    const options =
      nameOrOptions && typeof nameOrOptions === 'object' && !isBinary(nameOrOptions)
        ? nameOrOptions
        : { name: nameOrOptions, content, provenance };

    const answer = await this.request('addPages', 'addPagesRsp', {
      name: options.name || 'document.pdf',
      content: options.content,
      provenance: options.provenance,
    });

    if (answer?.ok === false) {
      throw new Error(`pdfmerge: loading failed: ${answer.error}`);
    }

    return answer;
  }

  /** The current pages, each with its provenance. */
  async getPages() {
    const answer = await this.request('pages', 'pagesRsp');
    return answer?.pages ?? [];
  }

  /**
   * Export a part as a PDF, or every part as a ZIP (`mode: "zip"`).
   *
   * `reference` is a part index or a part name; without it every page goes into
   * one document. Resolves with a Blob and emits "export".
   */
  async exportDocument(reference, mode = 'pdf') {
    const byIndex = Number.isInteger(reference);
    const answer = await this.request('export', 'exportRsp', {
      mode,
      part: byIndex ? reference : undefined,
      reference: byIndex ? undefined : reference,
    });

    if (answer?.error) {
      throw new Error(`pdfmerge: export failed: ${answer.error}`);
    }

    const blob = new Blob([answer.bytes], { type: answer.mimeType || 'application/pdf' });
    this.emit('export', {
      reference,
      mode,
      fileName: answer.fileName,
      pages: answer.pages ?? [],
      blob,
    });

    return blob;
  }

  /** Remove the iframe and stop listening. */
  destroy() {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    window.removeEventListener('message', this.handleMessage);
    clearTimeout(this.readyTimer);

    for (const [, entry] of this.pending) {
      clearTimeout(entry.timer);
      entry.reject(new Error('pdfmerge: the editor was destroyed'));
    }
    this.pending.clear();

    this.iframe.remove();
  }

  /** postMessage into the iframe. */
  send(message) {
    this.iframe.contentWindow?.postMessage({ partner: 'pdfmerge', ...message }, this.origin);
  }

  /** Send a request and wait for the answer that echoes its id. */
  request(op, responseOp, payload = {}, timeout = DEFAULT_TIMEOUT) {
    const id = ++this.requestId;

    return new Promise((resolve, reject) => {
      if (this.destroyed) {
        reject(new Error('pdfmerge: the editor was destroyed'));
        return;
      }

      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`pdfmerge: "${op}" timed out after ${timeout} ms`));
      }, timeout);

      this.pending.set(id, { op: responseOp, resolve, reject, timer });
      this.send({ op, id, ...payload });
    });
  }

  receive(event) {
    if (event.origin !== this.origin) {
      return;
    }
    if (event.source !== this.iframe.contentWindow) {
      return;
    }

    const data = event.data;
    if (!data || typeof data !== 'object') {
      return;
    }

    switch (data.op) {
      case 'init':
        this.clearReadyTimer();
        this.send({ op: 'initRsp', config: this.config });
        if (!this.readyDone) {
          this.readyDone = true;
          this.resolveReady(this);
        }
        return;

      case 'licenseRequest':
        // The editor is framed and tainted: answer with the licence it may use.
        // Without `apiKey` there is nothing to send and it stays in test mode.
        if (this.config.apiKey) {
          this.send({ op: 'licenseRsp', token: this.config.apiKey });
        }
        return;

      case 'licenseStatus':
        // The editor tells us whether the licence was accepted, so a host can
        // show the state instead of guessing.
        this.emit('license', { licensed: Boolean(data.licensed), reason: data.reason });
        return;

      case 'action':
        this.emit('action', {
          action: data.action,
          where: data.where,
          reference: data.reference,
          part: data.part,
        });
        return;

      case 'pagesRsp':
      case 'exportRsp':
      case 'addPagesRsp':
      case 'addFilesRsp': {
        const entry = data.id === undefined ? undefined : this.pending.get(data.id);

        if (entry && entry.op === data.op) {
          clearTimeout(entry.timer);
          this.pending.delete(data.id);
          entry.resolve(data);
        }
        return;
      }

      default:
        return;
    }
  }

  emit(event, payload) {
    for (const handler of this.handlers.get(event) ?? []) {
      try {
        handler(payload);
      } catch (error) {
        // A failing consumer handler must not break the message loop.
        console.error('pdfmerge: event handler failed', error);
      }
    }
  }

  clearReadyTimer() {
    if (this.readyTimer) {
      clearTimeout(this.readyTimer);
      this.readyTimer = null;
    }
  }
}

export default PDFMergeSortSplitClass;
