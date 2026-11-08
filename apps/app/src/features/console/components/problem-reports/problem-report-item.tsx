import { useTranslation } from 'react-i18next';

import type { ProblemReport } from '@repo/schema/console';
import { czechDateTime } from '@repo/schema/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProblemReportItemProps {
  report: ProblemReport;
  isResolving: boolean;
  onResolve: () => void;
}

// One report: what kind, from whom and where, its text, and whether it is dealt with.
export function ProblemReportItem({ report, isResolving, onResolve }: ProblemReportItemProps) {
  const { t } = useTranslation('console');
  const isResolved = report.resolvedAt !== null;

  return (
    <li
      className={cn(
        'flex flex-col gap-1.5 border-t border-border-subtle py-3 first:border-t-0',
        isResolved && 'text-muted-foreground',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 font-semibold">{t(`reports.kinds.${report.kind}`)}</span>
        {isResolved ? (
          <Badge variant="success">{t('reports.resolved')}</Badge>
        ) : (
          <Button type="button" size="sm" variant="outline" disabled={isResolving} onClick={onResolve}>
            {t('reports.resolve')}
          </Button>
        )}
      </div>
      <span className="text-[13px] text-muted-foreground">
        {t('reports.meta', {
          organisation: report.organisation?.displayName ?? t('reports.noOrganisation'),
          from: report.from ?? t('reports.anonymous'),
          sentAt: czechDateTime(report.sentAt),
        })}
      </span>
      <p className="whitespace-pre-line">{report.text}</p>
      <span className="text-[13px] break-all text-subtle-foreground">{report.pageUrl}</span>
    </li>
  );
}
