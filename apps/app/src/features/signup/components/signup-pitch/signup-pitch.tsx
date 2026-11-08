import { CheckIcon } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

import { TextLink } from '@/components/text-link';
import { SIGNUP_LINKS } from '@/features/signup/signup.constant';

const POINTS = ['address', 'payments', 'consents'] as const;

// Why an Organisation signs up: a headline, a lead and three benefits, in the platform's own colour.
export function SignupPitch() {
  const { t } = useTranslation('signup');

  return (
    <section className="flex flex-col gap-5 rounded-[32px] bg-campie-soft p-6 sm:p-10 lg:sticky lg:top-6">
      <h1 className="font-display text-4xl leading-none font-extrabold tracking-[-0.04em] sm:text-5xl">
        {t('pitch.title')}
      </h1>
      <p className="text-lg text-nav-foreground">{t('pitch.lead')}</p>
      <ul className="flex flex-col gap-3">
        {POINTS.map((point) => (
          <li key={point} className="flex items-start gap-3 text-base">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-card" aria-hidden="true">
              <CheckIcon className="size-3.5" strokeWidth={3} />
            </span>
            <span className="pt-0.5">{t(`pitch.points.${point}`)}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-nav-foreground">
        <Trans t={t} i18nKey="dataPage" components={{ a: <TextLink href={SIGNUP_LINKS.dataPage} /> }} />
      </p>
    </section>
  );
}
