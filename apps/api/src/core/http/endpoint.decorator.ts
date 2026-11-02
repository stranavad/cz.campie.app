import {
  applyDecorators,
  Body,
  HttpCode,
  Injectable,
  Param,
  Query,
  RequestMapping,
  RequestMethod,
  SetMetadata,
  UseInterceptors,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, type Observable } from 'rxjs';

import { endpointStatus, type EndpointDefinition, type EndpointResponse } from '@repo/schema/shared';

const ENDPOINT = Symbol('endpoint');

// Every answer leaves through its endpoint's response schema, which drops undeclared keys, so a field no
// contract declares never reaches the client. It runs inside the request's unit of work: a response that
// does not match is a server bug, fails as 500 and rolls the change back.
@Injectable()
class EndpointResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const endpoint = this.reflector.get<EndpointDefinition>(ENDPOINT, context.getHandler());
    const schema = endpoint.response;

    return next.handle().pipe(map((value: unknown) => (schema === undefined ? undefined : schema.parse(value))));
  }
}

// A route method returning what its endpoint answers.
type Handler<Endpoint extends EndpointDefinition> = (...args: never[]) => Promise<EndpointResponse<Endpoint>>;

/**
 * Route a controller method by its contract: method, path, status and response shaping.
 * @param endpoint the endpoint from @repo/schema
 */
export function Endpoint<E extends EndpointDefinition>(
  endpoint: E,
): (target: object, key: string | symbol, descriptor: TypedPropertyDescriptor<Handler<E>>) => void {
  return applyDecorators(
    RequestMapping({ path: endpoint.path, method: RequestMethod[endpoint.method] }),
    HttpCode(endpointStatus(endpoint)),
    SetMetadata(ENDPOINT, endpoint),
    UseInterceptors(EndpointResponseInterceptor),
  );
}

/**
 * The request body, parsed by the endpoint's body schema.
 * @param endpoint the endpoint from @repo/schema
 */
export function EndpointBody(endpoint: EndpointDefinition & { readonly body: object }): ParameterDecorator {
  return Body({ schema: endpoint.body });
}

/**
 * The path params, parsed by the endpoint's params schema.
 * @param endpoint the endpoint from @repo/schema
 */
export function EndpointParams(endpoint: EndpointDefinition & { readonly params: object }): ParameterDecorator {
  return Param({ schema: endpoint.params });
}

/**
 * The query, parsed by the endpoint's query schema.
 * @param endpoint the endpoint from @repo/schema
 */
export function EndpointQuery(endpoint: EndpointDefinition & { readonly query: object }): ParameterDecorator {
  return Query({ schema: endpoint.query });
}
