import {
  useDiscountCodesQuery,
  useRemoveDiscountCodeMutation,
  useUpdateDiscountCodeMutation,
} from '@/features/camps/api/camps.queries';

export function useDiscountCodeSection(organisationId: string, campId: string) {
  const codes = useDiscountCodesQuery(organisationId, campId);
  const update = useUpdateDiscountCodeMutation(organisationId, campId);
  const remove = useRemoveDiscountCodeMutation(organisationId, campId);

  return {
    codes,
    toggle: (discountCodeId: string, active: boolean) => update.mutate({ discountCodeId, body: { active } }),
    // Only a code nobody used, such as one with a typo; a used one is switched off instead.
    remove: (discountCodeId: string) => remove.mutate(discountCodeId),
    isUpdating: update.isPending || remove.isPending,
    updateFailed: update.isError || remove.isError,
  };
}
