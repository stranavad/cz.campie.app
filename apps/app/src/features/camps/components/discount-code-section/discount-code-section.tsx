import { useTranslation } from 'react-i18next';

import type { DiscountCodeResource } from '@repo/schema/camps';

import { Button } from '@/components/ui/button';
import { DiscountCodeForm } from '@/features/camps/components/discount-code-section/discount-code-form';
import { useDiscountCodeSection } from '@/features/camps/components/discount-code-section/use-discount-code-section.hook';

interface DiscountCodeSectionProps {
  organisationId: string;
  campId: string;
  canWrite: boolean;
}

/**
 * Write a calendar date as Czech readers write it.
 * @param date YYYY-MM-DD
 */
function czechDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);

  return `${day}. ${month}. ${year}`;
}

// A Camp's Discount codes with their uses and status; codes are switched off, never deleted.
export function DiscountCodeSection({ organisationId, campId, canWrite }: DiscountCodeSectionProps) {
  const { t } = useTranslation('camps');
  const section = useDiscountCodeSection(organisationId, campId);

  const describe = (code: DiscountCodeResource) =>
    [
      t(`discountCodes.values.${code.kind}`, { value: code.value }),
      t('discountCodes.uses', { uses: code.uses, limit: code.usageLimit ?? '∞' }),
      code.expiresOn === null ? null : t('discountCodes.until', { date: czechDate(code.expiresOn) }),
      t(`discountCodes.statuses.${code.status}`),
    ]
      .filter((part) => part !== null)
      .join(' · ');

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t('discountCodes.title')}</h2>
      {section.codes.isPending ? <p className="text-muted-foreground">{t('loading')}</p> : null}
      {section.codes.isError ? <p className="text-destructive">{t('error')}</p> : null}
      {section.codes.data?.length === 0 ? <p className="text-muted-foreground">{t('discountCodes.empty')}</p> : null}
      <ul className="flex flex-col">
        {(section.codes.data ?? []).map((code) => (
          <li key={code.id} className="flex flex-wrap items-center gap-3 border-b border-border py-3">
            <span className="font-mono font-medium">{code.code}</span>
            <span className="text-sm text-muted-foreground">{describe(code)}</span>
            {canWrite ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={section.isUpdating}
                onClick={() => section.toggle(code.id, !code.active)}
              >
                {code.active ? t('discountCodes.deactivate') : t('discountCodes.activate')}
              </Button>
            ) : null}
            {canWrite && code.uses === 0 ? (
              <Button variant="ghost" size="sm" disabled={section.isUpdating} onClick={() => section.remove(code.id)}>
                {t('discountCodes.remove')}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {section.updateFailed ? (
        <p role="alert" className="text-sm text-destructive">
          {t('failure')}
        </p>
      ) : null}
      {canWrite ? <DiscountCodeForm organisationId={organisationId} campId={campId} /> : null}
    </section>
  );
}
