// Everything the signup form asks the API sits under one key.
export const signupKeys = {
  all: ['signup'] as const,
  subdomain: (subdomain: string) => [...signupKeys.all, 'subdomain', subdomain] as const,
};
