import { useTranslation } from 'react-i18next';

import { czechDateTime } from '@repo/schema/shared';

import { Button } from '@/components/ui/button';
import { useProblemReportsQuery, useResolveProblemReportMutation } from '@/features/console/api/console.queries';

// Feedback from admins and technical problems from guardians, open ones first.
export function ProblemReports() {
  const { t } = useTranslation('console');
  const reports = useProblemReportsQuery();
  const resolve = useResolveProblemReportMutation();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('reports.title')}</h2>
      {reports.data?.length === 0 ? <p className="text-sm text-muted-foreground">{t('reports.none')}</p> : null}
      <ul className="flex flex-col divide-y rounded-lg border text-sm">
        {(reports.data ?? []).map((report) => (
          <li
            key={report.id}
            className={`flex flex-col gap-1 p-3 ${report.resolvedAt === null ? '' : 'text-muted-foreground'}`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium">{t(`reports.kinds.${report.kind}`)}</span>
              <span>{report.organisation?.displayName ?? t('reports.noOrganisation')}</span>
              <span>{report.from ?? t('reports.anonymous')}</span>
              <span>{czechDateTime(report.sentAt)}</span>
              {report.resolvedAt === null ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={resolve.isPending}
                  onClick={() => resolve.mutate(report.id)}
                >
                  {t('reports.resolve')}
                </Button>
              ) : (
                <span>{t('reports.resolved')}</span>
              )}
            </div>
            <span className="break-all text-muted-foreground">{report.pageUrl}</span>
            <p className="whitespace-pre-line">{report.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
