import { useTranslation } from 'react-i18next';

interface LockedAnswerProps {
  answer: string;
}

// An answer only the camp may change now, shown as text.
export function LockedAnswer({ answer }: LockedAnswerProps) {
  const { t } = useTranslation('portal');

  return <p className="rounded-2xl bg-muted px-4 py-3 text-sm">{t('edit.locked', { answer })}</p>;
}
