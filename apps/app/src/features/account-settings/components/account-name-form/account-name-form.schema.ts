import { updateAccountBodySchema } from '@repo/schema/admins';

// As the API checks it: both names, trimmed, without invisible characters.
export const accountNameFormSchema = updateAccountBodySchema;
