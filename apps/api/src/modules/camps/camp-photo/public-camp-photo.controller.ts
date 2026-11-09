import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';

import { Access } from '../../../core/access/access.decorator.ts';
import { PUBLIC_IMAGE_HEADERS } from '../../../core/files/public-image.ts';
import { CampPhotoService } from './services/camp-photo.service.ts';

const photoParamsSchema = z.object({ fileId: z.uuid() });

// An image, not JSON, so routed by hand like a logo.
@Access('public')
@Controller()
export class PublicCampPhotoController {
  constructor(private readonly photos: CampPhotoService) {}

  @Get('camp-photos/:fileId')
  public async get(
    @Param({ schema: photoParamsSchema }) { fileId }: z.infer<typeof photoParamsSchema>,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { contentType, bytes } = await this.photos.readPublic(fileId);

    response.set(PUBLIC_IMAGE_HEADERS);

    return new StreamableFile(bytes, { type: contentType, length: bytes.length });
  }
}
