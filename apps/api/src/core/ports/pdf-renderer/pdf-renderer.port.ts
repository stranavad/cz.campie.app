export abstract class PdfRenderer {
  /**
   * Render a complete HTML document to a PDF.
   * @param html the document, with styles inline
   */
  public abstract render(html: string): Promise<Buffer>;

  /**
   * Check that the renderer is reachable; for the health check only.
   * @param signal gives up when aborted
   */
  public abstract ping(signal: AbortSignal): Promise<void>;
}
