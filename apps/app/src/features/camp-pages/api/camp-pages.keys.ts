// The subdomain's public Camps and their Turnusy sit under one key.
export const campPagesKeys = {
  all: ['camp-pages'] as const,
  list: () => [...campPagesKeys.all, 'list'] as const,
  camp: (slug: string) => [...campPagesKeys.all, slug] as const,
  turnusy: (slug: string) => [...campPagesKeys.camp(slug), 'turnusy'] as const,
};
