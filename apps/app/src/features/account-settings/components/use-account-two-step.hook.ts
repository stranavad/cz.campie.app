import { useTranslation } from 'react-i18next';

import type { Account } from '@repo/schema/admins';

import { useShowRecoveryCodes } from '@/core/two-step';

export function useAccountTwoStep(totp: Account['totp']) {
  const { i18n } = useTranslation();
  const showRecoveryCodes = useShowRecoveryCodes();

  return {
    showRecoveryCodes,
    // The day it was turned on, on the Prague calendar wherever the admin is.
    enabledOn:
      totp === null ? null : new Date(totp.enabledAt).toLocaleDateString(i18n.language, { timeZone: 'Europe/Prague' }),
  };
}
