import type { Env } from '../../config/env.schema.ts';
import { PdfRenderer } from './pdf-renderer.port.ts';

type GotenbergConfig = Extract<Env['pdfRenderer'], { adapter: 'gotenberg' }>;

export class GotenbergPdfRenderer extends PdfRenderer {
  private readonly baseUrl: string;

  constructor(config: GotenbergConfig) {
    super();
    // Joined by hand so a Gotenberg behind a path prefix keeps it.
    this.baseUrl = config.url.replace(/\/+$/, '');
  }

  public async render(html: string): Promise<Buffer> {
    const form = new FormData();
    form.append('files', new Blob([html], { type: 'text/html' }), 'index.html');
    // The document's @page rule sets paper and margins, not Gotenberg's Letter default; the accent colour
    // prints only with backgrounds on.
    form.append('preferCssPageSize', 'true');
    form.append('printBackground', 'true');

    const response = await fetch(`${this.baseUrl}/forms/chromium/convert/html`, { method: 'POST', body: form });

    if (!response.ok) {
      throw new Error(`Gotenberg answered ${response.status}: ${await response.text()}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  public async ping(signal: AbortSignal): Promise<void> {
    const response = await fetch(`${this.baseUrl}/health`, { signal });

    if (!response.ok) {
      throw new Error(`Gotenberg answered ${response.status}`);
    }
  }
}
