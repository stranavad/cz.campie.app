import { PdfRenderer } from './pdf-renderer.port.ts';

// The smallest file a PDF reader recognises; tests check what was asked for, not the rendering.
const FAKE_PDF = Buffer.from('%PDF-1.7\n%%EOF\n');

export class FakePdfRenderer extends PdfRenderer {
  public render(_html: string): Promise<Buffer> {
    return Promise.resolve(Buffer.from(FAKE_PDF));
  }

  public ping(_signal: AbortSignal): Promise<void> {
    return Promise.resolve();
  }
}
