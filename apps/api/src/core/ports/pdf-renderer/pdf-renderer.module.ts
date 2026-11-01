import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.schema.ts';
import { FakePdfRenderer } from './fake-pdf-renderer.adapter.ts';
import { GotenbergPdfRenderer } from './gotenberg-pdf-renderer.adapter.ts';
import { PdfRenderer } from './pdf-renderer.port.ts';

@Global()
@Module({
  providers: [
    {
      provide: PdfRenderer,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): PdfRenderer => {
        const pdfRenderer = config.get('pdfRenderer', { infer: true });

        return pdfRenderer.adapter === 'gotenberg' ? new GotenbergPdfRenderer(pdfRenderer) : new FakePdfRenderer();
      },
    },
  ],
  exports: [PdfRenderer],
})
export class PdfRendererModule {}
