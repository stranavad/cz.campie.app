import { Global, Module, type OnModuleInit } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants.js';
import { RequestMethod } from '@nestjs/common/enums/request-method.enum.js';
import {
  APP_GUARD,
  APP_INTERCEPTOR,
  DiscoveryModule,
  DiscoveryService,
  MetadataScanner,
  Reflector,
} from '@nestjs/core';

import { previewOrganisationEndpoint } from '@repo/schema/console';

import { Access } from './access.decorator.ts';
import { AccessGuard } from './access.guard.ts';
import { AccessService } from './access.service.ts';
import { OrganisationHostCache } from './organisation-host-cache.ts';
import { RequirePermission } from './permission.ts';
import { UnitOfWorkInterceptor } from './unit-of-work.interceptor.ts';

// A class or method that Nest reads metadata from.
type MetadataTarget = Parameters<Reflector['get']>[1];

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [
    AccessService,
    OrganisationHostCache,
    { provide: APP_GUARD, useClass: AccessGuard },
    { provide: APP_INTERCEPTOR, useClass: UnitOfWorkInterceptor },
  ],
  exports: [OrganisationHostCache],
})
export class AccessModule implements OnModuleInit {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly scanner: MetadataScanner,
  ) {}

  // No route is reachable by accident: a controller without a declared access, an admin route without a
  // declared permission, a permission where no membership is checked, or an operator-preview route other
  // than the preview of public pages stops the app booting.
  public onModuleInit(): void {
    const problems = this.discovery
      .getControllers()
      .flatMap(({ metatype }) => (metatype ? this.problemsOf(metatype) : []));

    if (problems.length > 0) {
      throw new Error(problems.join('; '));
    }
  }

  /**
   * List what a controller fails to declare, or declares where it means nothing.
   * @param controller the controller class
   */
  private problemsOf(controller: MetadataTarget): string[] {
    const kind = this.reflector.get(Access, controller);

    if (kind === undefined) {
      return [`Declare @Access(...) on every controller; missing on ${controller.name}`];
    }

    const prototype: unknown = controller.prototype;

    if (typeof prototype !== 'object' || prototype === null) {
      return [];
    }

    return this.scanner.getAllMethodNames(prototype).flatMap((name) => {
      const route: unknown = Reflect.get(prototype, name);

      if (typeof route !== 'function' || this.reflector.get<string | undefined>(PATH_METADATA, route) === undefined) {
        return [];
      }

      const declared = this.reflector.getAllAndOverride(RequirePermission, [route, controller]) !== undefined;

      // The operator's preview runs in an Organisation's unit of work without its support grant, so it may
      // reach the public pages' data only.
      if (
        kind === 'operator-preview' &&
        (this.reflector.get<string | undefined>(PATH_METADATA, route) !== previewOrganisationEndpoint.path ||
          this.reflector.get<RequestMethod | undefined>(METHOD_METADATA, route) !== RequestMethod.GET)
      ) {
        return [`operator-preview serves only the public pages' preview; found on ${controller.name}.${name}`];
      }

      if (kind === 'admin' && !declared) {
        return [`Declare @Requires(...) on every admin route; missing on ${controller.name}.${name}`];
      }

      if (kind !== 'admin' && declared) {
        return [`@Requires(...) applies only to admin routes; found on ${controller.name}.${name}`];
      }

      return [];
    });
  }
}
