import { useTranslation } from 'react-i18next';

import { useSubmittedPrihlaskyQuery } from '@/features/registration/api/registration.queries';

/**
 * The Přihláška of each Participant right after the submission: its link once generated, and how to name
 * it, by first name once there are several.
 * @param slug the Camp's slug
 * @param submittedKey the key the Registration was submitted with
 * @param firstNames the Participants' first names, in the order they were submitted
 */
export function useSubmittedPrihlasky(slug: string, submittedKey: string, firstNames: readonly string[]) {
  const { t } = useTranslation('registration');
  const prihlasky = useSubmittedPrihlaskyQuery(slug, submittedKey);

  return prihlasky.data?.participants.map(({ position, prihlaska }) => {
    const name = firstNames[position] ?? '';

    return {
      position,
      url: prihlaska?.url ?? null,
      label: firstNames.length > 1 ? t('submitted.prihlaska.downloadFor', { name }) : t('submitted.prihlaska.download'),
      preparing: t('submitted.prihlaska.preparing', { name }),
    };
  });
}
