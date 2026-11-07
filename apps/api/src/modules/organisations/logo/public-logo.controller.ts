import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';

import { Access } from '../../../core/access/access.decorator.ts';
import { LogoService } from './services/logo.service.ts';

const logoParamsSchema = z.object({ fileId: z.uuid() });

// An image, not JSON, so routed by hand like a download. Its address carries the file id, and a new logo
// gets a new one, so browsers and proxies may keep it for good.
@Access('public')
@Controller()
export class PublicLogoController {
  constructor(private readonly logos: LogoService) {}

  @Get('logos/:fileId')
  public async get(
    @Param({ schema: logoParamsSchema }) { fileId }: z.infer<typeof logoParamsSchema>,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { contentType, bytes } = await this.logos.readPublic(fileId);

    response.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      // Opened on its own, the image may run nothing and load nothing.
      'Content-Security-Policy': "default-src 'none'; sandbox",
    });

    return new StreamableFile(bytes, { type: contentType, length: bytes.length });
  }
}
