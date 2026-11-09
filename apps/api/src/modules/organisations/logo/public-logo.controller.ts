import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';

import { Access } from '../../../core/access/access.decorator.ts';
import { PUBLIC_IMAGE_HEADERS } from '../../../core/files/public-image.ts';
import { LogoService } from './services/logo.service.ts';

const logoParamsSchema = z.object({ fileId: z.uuid() });

// An image, not JSON, so routed by hand like a download.
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

    response.set(PUBLIC_IMAGE_HEADERS);

    return new StreamableFile(bytes, { type: contentType, length: bytes.length });
  }
}
