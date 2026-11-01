import { PdfRenderer } from './pdf-renderer.port.ts';

// The smallest file a PDF reader recognises; tests check what was asked for, not the rendering.
const FAKE_PDF = Buffer.from('%PDF-1.7\n%%EOF\n');

// Keeps the HTML of every render so a test can read what the app put into its PDFs.
export class FakePdfRenderer extends PdfRenderer {
  public readonly rendered: string[] = [];

  public render(html: string): Promise<Buffer> {
    this.rendered.push(html);

    return Promise.resolve(Buffer.from(FAKE_PDF));
  }

  public ping(_signal: AbortSignal): Promise<void> {
    return Promise.resolve();
  }
}
