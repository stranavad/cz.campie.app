import { z } from 'zod';

// The one queue every job goes through.
export const JOB_QUEUE = 'jobs';

// An Organisation job runs in the unit of work of the Organisation that enqueued it; a platform job (such
// as notifying the Platform operator) runs in a platform unit of work, which sees no Organisation's rows.
export type JobScope = 'organisation' | 'platform';

// The payload is stored as JSON in Redis, outside the database's encryption and erasure: ids only, never
// personal data.
export interface JobDefinition<Payload extends z.ZodType = z.ZodType> {
  readonly name: string;
  readonly scope: JobScope;
  readonly payload: Payload;
}

export type JobPayload<Job extends JobDefinition> = z.output<Job['payload']>;

/**
 * Declare a job: its name in the queue, its scope and the schema of its payload.
 * @param job the definition
 */
export function defineJob<Payload extends z.ZodType>(job: JobDefinition<Payload>): JobDefinition<Payload> {
  return job;
}

// Runs one job. A provider extending this class handles its job; the runner finds it when the app starts.
export abstract class JobHandler<Job extends JobDefinition = JobDefinition> {
  public abstract readonly job: Job;

  public abstract handle(payload: JobPayload<Job>): Promise<void>;
}

// What a queued job carries besides its name: the Organisation it belongs to (null for a platform job)
// and its payload.
export const jobEnvelope = z.object({
  organisationId: z.uuid().nullable(),
  payload: z.unknown(),
});

export type JobEnvelope = z.output<typeof jobEnvelope>;
