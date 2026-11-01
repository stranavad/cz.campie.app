import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { from, lastValueFrom, type Observable } from 'rxjs';

import { UnitOfWork } from '../database/unit-of-work.ts';
import { requestScope } from './request-scope.ts';

// Runs each route inside the unit of work of the Organisation its access resolved to, so the whole route
// commits or rolls back as one. Route interceptors run inside it, an upload's parsing included, which
// holds the transaction open while the body arrives.
@Injectable()
export class UnitOfWorkInterceptor implements NestInterceptor {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const scope = requestScope(context.switchToHttp().getRequest<Request>());
    const handle = () => lastValueFrom(next.handle(), { defaultValue: undefined });

    if ('organisationId' in scope) {
      return from(this.unitOfWork.run(scope.organisationId, handle));
    }

    if (scope.access === 'platform') {
      return from(this.unitOfWork.runForPlatform(handle));
    }

    return next.handle();
  }
}
