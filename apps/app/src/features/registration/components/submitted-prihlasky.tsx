import { DownloadIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { useSubmittedPrihlasky } from '@/features/registration/components/use-submitted-prihlasky.hook';

interface SubmittedPrihlaskyProps {
  slug: string;
  submittedKey: string;
  // The Participants' first names, in the order they were submitted.
  firstNames: readonly string[];
}

// The Přihláška PDF of each Participant, to download at once instead of waiting for the email; one still
// being made shows as such until it is ready.
export function SubmittedPrihlasky({ slug, submittedKey, firstNames }: SubmittedPrihlaskyProps) {
  const { t } = useTranslation('registration');
  const prihlasky = useSubmittedPrihlasky(slug, submittedKey, firstNames);

  if (prihlasky === undefined) {
    return null;
  }

  return (
    <Card>
      <CardTitle>{t('submitted.prihlaska.title')}</CardTitle>
      <div className="flex flex-col gap-2">
        {prihlasky.map(({ position, url, label, preparing }) =>
          url === null ? (
            <p key={position} className="text-sm text-muted-foreground">
              {preparing}
            </p>
          ) : (
            <a
              key={position}
              href={url}
              download
              className={buttonVariants({ variant: 'outline', size: 'lg', className: 'w-full whitespace-normal' })}
            >
              <DownloadIcon aria-hidden="true" />
              {label}
            </a>
          ),
        )}
      </div>
    </Card>
  );
}
