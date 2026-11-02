import { StandardSchemaValidationPipe, type INestApplication } from '@nestjs/common';

import { HttpErrorFilter } from './core/http/http-error.filter.ts';

export function setupApp<T extends INestApplication>(app: T): T {
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpErrorFilter());
  // Every body, query and param declared with a schema arrives parsed: unknown keys stripped, defaults set.
  app.useGlobalPipes(new StandardSchemaValidationPipe());

  return app;
}
