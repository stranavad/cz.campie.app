import { Global, Module, type OnModuleInit } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, DiscoveryModule, DiscoveryService, Reflector } from '@nestjs/core';

import { Access } from './access.decorator.ts';
import { AccessGuard } from './access.guard.ts';
import { AccessService } from './access.service.ts';
import { UnitOfWorkInterceptor } from './unit-of-work.interceptor.ts';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [
    AccessService,
    { provide: APP_GUARD, useClass: AccessGuard },
    { provide: APP_INTERCEPTOR, useClass: UnitOfWorkInterceptor },
  ],
})
export class AccessModule implements OnModuleInit {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  // No route is reachable by accident: a controller without a declared access stops the app booting.
  public onModuleInit(): void {
    const undeclared = this.discovery
      .getControllers()
      .flatMap(({ metatype }) =>
        metatype && this.reflector.get(Access, metatype) === undefined ? [metatype.name] : [],
      );

    if (undeclared.length > 0) {
      throw new Error(`Declare @Access(...) on every controller; missing on ${undeclared.join(', ')}`);
    }
  }
}
