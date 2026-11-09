import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';

const VARIANT = { signed: 'success', unsigned: 'danger', withdrawn: 'warning' } as const;

interface ConsentStateBadgeProps {
  state: keyof typeof VARIANT;
}

// A Consent's state for one child as a pill.
export function ConsentStateBadge({ state }: ConsentStateBadgeProps) {
  const { t } = useTranslation('participants');

  return <Badge variant={VARIANT[state]}>{t(`consents.states.${state}`)}</Badge>;
}
