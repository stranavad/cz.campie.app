import {
  BadRequestException,
  createParamDecorator,
  Injectable,
  PayloadTooLargeException,
  type CallHandler,
  type ExecutionContext,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Observable } from 'rxjs';
import { z } from 'zod';

import { MAX_FILE_BYTES, type FileErrorCode } from '@repo/schema/files';

// An uploaded file as the browser sent it; FileService.store checks what it really is.
export interface FileUpload {
  readonly name: string;
  readonly bytes: Buffer;
}

// The file field of a multipart request, as multer keeps it in memory.
const receivedFile = z.object({ originalname: z.string(), buffer: z.instanceof(Buffer) });

/**
 * Build the exception of a rejected upload, with the code the app translates.
 * @param code why the upload was rejected
 */
export function uploadRejected(code: FileErrorCode): BadRequestException | PayloadTooLargeException {
  const body = { code, message: `Upload rejected: ${code}` };

  return code === 'file_too_large' ? new PayloadTooLargeException(body) : new BadRequestException(body);
}

const MulterInterceptor = FileInterceptor('file', {
  // Held in memory: a file is encrypted whole before storage, and the limit stops the request at the
  // first byte past it.
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  // Browsers send UTF-8 file names; multer would read them as Latin-1 and garble Czech ones.
  defParamCharset: 'utf8',
});

// Reads the one file of a multipart request in the field `file`, read with @UploadedFile().
@Injectable()
export class FileUploadInterceptor extends MulterInterceptor {
  public override async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    try {
      return await super.intercept(context, next);
    } catch (error) {
      if (error instanceof PayloadTooLargeException) {
        throw uploadRejected('file_too_large');
      }

      throw error;
    }
  }
}

// The file read by FileUploadInterceptor; a request without one is rejected.
export const UploadedFile = createParamDecorator((_data: unknown, context: ExecutionContext): FileUpload => {
  const parsed = receivedFile.safeParse(context.switchToHttp().getRequest<{ file?: unknown }>().file);

  if (!parsed.success) {
    throw uploadRejected('file_missing');
  }

  return { name: parsed.data.originalname, bytes: parsed.data.buffer };
});
