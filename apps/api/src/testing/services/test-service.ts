export type ServiceEnv = Record<string, string>;

export interface Started {
  readonly env: ServiceEnv;
  readonly cleanup: () => Promise<void>;
}

// An external service the integration tests run for real. It starts once per run and hands its env
// values to every test; isolate() runs per test and returns the env that gives the test its own copy.
export interface TestService {
  start(): Promise<Started>;
  isolate(env: ServiceEnv): Promise<Started>;
}

declare module 'vitest' {
  export interface ProvidedContext {
    testServiceEnv: ServiceEnv;
  }
}
