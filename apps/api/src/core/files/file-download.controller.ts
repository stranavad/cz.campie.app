import { pipeline } from 'node:stream/promises';
import { Controller, Get, Logger, Param, Res } from '@nestjs/common';
import type { Response } from 'express';

import { FileService } from './file.service.ts';

// Public: the signed token is the permission, checked by whoever handed out the link.
@Controller()
export class FileDownloadController {
  private readonly logger = new Logger(FileDownloadController.name);

  constructor(private readonly files: FileService) {}

  // Streamed by hand rather than returned, so a file failing to decrypt midway aborts the response
  // instead of ending it as if complete.
  @Get('downloads/:token')
  public async download(@Param('token') token: string, @Res() response: Response): Promise<void> {
    const file = await this.files.open(token);

    response.set({
      'Content-Type': file.contentType,
      'Content-Length': String(file.size),
      'Content-Disposition': inlineDisposition(file.name),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });

    try {
      await pipeline(file.content, response);
    } catch (error) {
      this.logger.warn(
        `Download of file ${file.id} ended early: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

/**
 * Build a Content-Disposition that opens the file in the browser and saves it under its name: an ASCII
 * fallback for old clients and the exact UTF-8 name for the rest.
 * @param name the file's name
 */
function inlineDisposition(name: string): string {
  const fallback = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]|["\\]/g, '_');
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return `inline; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
