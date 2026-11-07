// A Camp's public form, its Turnusy and the live price sit under one key per Camp.
export const registrationKeys = {
  all: ['registration'] as const,
  camp: (slug: string) => [...registrationKeys.all, slug] as const,
  form: (slug: string) => [...registrationKeys.camp(slug), 'form'] as const,
  turnusy: (slug: string) => [...registrationKeys.camp(slug), 'turnusy'] as const,
  price: (slug: string, body: unknown) => [...registrationKeys.camp(slug), 'price', body] as const,
};
