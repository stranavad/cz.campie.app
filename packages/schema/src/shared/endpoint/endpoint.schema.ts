import type { z } from 'zod';

export type EndpointMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// The names of a path's `:params`, so a path with params can only be declared with a schema for each.
type PathParamNames<Path extends string> = Path extends `${string}:${infer Name}/${infer Rest}`
  ? Name | PathParamNames<`/${Rest}`>
  : Path extends `${string}:${infer Name}`
    ? Name
    : never;

type ParamsOf<Path extends string> = [PathParamNames<Path>] extends [never]
  ? { readonly params?: never }
  : { readonly params: z.ZodObject<{ [Name in PathParamNames<Path>]: z.ZodType<unknown, string> }> };

// One route of the API: the API routes and validates by it, the app calls it and validates its answer.
export interface EndpointDefinition {
  readonly method: EndpointMethod;
  // Relative to /api, in Express syntax.
  readonly path: string;
  readonly params?: z.ZodObject;
  readonly query?: z.ZodType;
  readonly body?: z.ZodType;
  // Omitted means the route answers without a body.
  readonly response?: z.ZodType;
  // Defaults to 204 without a response, 201 for POST, 200 otherwise.
  readonly status?: number;
}

/**
 * Declare an endpoint. A path with `:params` must declare `params` covering them; one without takes none.
 * @param endpoint method, path, the schemas of what it takes and answers, and its status
 */
export function defineEndpoint<const Definition extends EndpointDefinition>(
  endpoint: Definition & ParamsOf<Definition['path']>,
): Definition {
  return endpoint;
}

type Output<Schema> = Schema extends z.ZodType ? z.output<Schema> : undefined;
type Input<Schema> = Schema extends z.ZodType ? z.input<Schema> : undefined;

// The parsed shapes, as the API's handler receives them.
export type EndpointParams<Endpoint extends EndpointDefinition> = Output<Endpoint['params']>;
export type EndpointQuery<Endpoint extends EndpointDefinition> = Output<Endpoint['query']>;
export type EndpointBody<Endpoint extends EndpointDefinition> = Output<Endpoint['body']>;

// What the handler returns; the API passes it through the response schema, which drops undeclared keys.
export type EndpointResponse<Endpoint extends EndpointDefinition> = Endpoint['response'] extends z.ZodType
  ? z.input<Endpoint['response']>
  : void;

// What the app sends: only the parts the endpoint takes.
export type EndpointRequest<Endpoint extends EndpointDefinition> = (Endpoint['params'] extends z.ZodType
  ? { readonly params: Input<Endpoint['params']> }
  : { readonly params?: never }) &
  (Endpoint['query'] extends z.ZodType ? { readonly query: Input<Endpoint['query']> } : { readonly query?: never }) &
  (Endpoint['body'] extends z.ZodType ? { readonly body: Input<Endpoint['body']> } : { readonly body?: never });

/**
 * The status an endpoint answers with on success.
 * @param endpoint the endpoint
 */
export function endpointStatus(endpoint: EndpointDefinition): number {
  if (endpoint.status !== undefined) {
    return endpoint.status;
  }

  if (endpoint.response === undefined) {
    return 204;
  }

  return endpoint.method === 'POST' ? 201 : 200;
}

/**
 * Fill an endpoint's path with its params, each URL-encoded, relative to /api.
 * @param endpoint the endpoint
 * @param params a value per `:param` of the path
 * @throws {Error} when a param of the path has no value
 */
export function endpointPath(
  endpoint: EndpointDefinition,
  params: Readonly<Record<string, string | number>> = {},
): string {
  return endpoint.path.replaceAll(/:([A-Za-z0-9_]+)/g, (_, name: string) => {
    const value = params[name];

    if (value === undefined) {
      throw new Error(`The path ${endpoint.path} needs the param ${name}`);
    }

    return encodeURIComponent(String(value));
  });
}
