import type { z } from 'zod';

import {
  endpointPath,
  type EndpointDefinition,
  type EndpointRequest,
  type EndpointResponse,
} from '@repo/schema/shared';

import { readErrorResponse } from '@/lib/api/error-response.helper';
import { HttpError, NetworkError, ResponseValidationError, TimeoutError, UnknownApiError } from '@/lib/api/errors';
import { onRequest, onResponse } from '@/lib/api/request-hooks';

const TIMEOUT_MS = 30_000;

// The endpoint's params, query and body (only those it declares), plus the caller's cancel signal.
export type RequestOptions<Endpoint extends EndpointDefinition> = EndpointRequest<Endpoint> & {
  // Pass TanStack Query's signal, so an unmounted query cancels its request.
  signal?: AbortSignal;
};

type QueryValue = string | number | boolean | null | undefined;

interface UntypedOptions {
  params?: Record<string, string | number>;
  query?: Record<string, QueryValue | QueryValue[]>;
  body?: unknown;
  signal?: AbortSignal;
}

// Same origin only: the proxy forwards /api to the API with the host the browser called.
function buildUrl(path: string, query: UntypedOptions['query']): URL {
  const url = new URL(`/api${path}`, window.location.origin);

  for (const [key, value] of Object.entries(query ?? {})) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined && item !== null) {
        url.searchParams.append(key, String(item));
      }
    }
  }

  return url;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text === '') {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function send(endpoint: EndpointDefinition, { params, query, body, signal }: UntypedOptions): Promise<unknown> {
  const path = endpointPath(endpoint, params);
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const headers = new Headers({ Accept: 'application/json' });

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const request = onRequest(
    new Request(buildUrl(path, query), {
      method: endpoint.method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal === undefined ? timeout : AbortSignal.any([signal, timeout]),
    }),
  );

  let response: Response;

  try {
    response = onResponse(await fetch(request));
  } catch (error) {
    // Cancelled by the caller, such as TanStack Query on unmount: not a failure.
    if (signal?.aborted === true) {
      throw error;
    }

    if (timeout.aborted) {
      throw new TimeoutError('The request timed out', { cause: error });
    }

    if (error instanceof TypeError) {
      throw new NetworkError('Network request failed', { cause: error });
    }

    throw new UnknownApiError('Unexpected error during request', { cause: error });
  }

  if (!response.ok) {
    const error = readErrorResponse(await readBody(response));

    throw new HttpError(error?.message ?? `Request failed with status ${response.status}`, {
      status: response.status,
      code: error?.code,
      details: error,
    });
  }

  const schema: z.ZodType | undefined = endpoint.response;

  if (schema === undefined) {
    return undefined;
  }

  const result = schema.safeParse(await readBody(response));

  if (!result.success) {
    throw new ResponseValidationError(`Response from ${endpoint.method} ${path} failed schema validation`, {
      issues: result.error.issues,
      cause: result.error,
    });
  }

  return result.data;
}

// The parsed response an endpoint resolves to.
type Answer<Endpoint extends EndpointDefinition> = Endpoint['response'] extends z.ZodType
  ? z.output<Endpoint['response']>
  : EndpointResponse<Endpoint>;

// JSON client driven by the @repo/schema endpoints: builds the path from params, sends query and body,
// validates the answer against the endpoint's schema. Throws ApiError subclasses, never raw fetch errors,
// except the caller's own cancellation.
export const apiClient = {
  request<Endpoint extends EndpointDefinition>(
    endpoint: Endpoint,
    ...[options]: object extends RequestOptions<Endpoint>
      ? [options?: RequestOptions<Endpoint>]
      : [options: RequestOptions<Endpoint>]
  ): Promise<Answer<Endpoint>> {
    return send(endpoint, (options ?? {}) as UntypedOptions) as Promise<Answer<Endpoint>>;
  },
};
