import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ProblemReportItem } from '@/features/console/components/problem-reports/problem-report-item';
import { useProblemReports } from '@/features/console/components/problem-reports/use-problem-reports.hook';

// Feedback from admins and technical problems from guardians, open ones first.
export function ProblemReports() {
  const { t } = useTranslation('console');
  const { reports, isEmpty, openCount, isResolving, resolve } = useProblemReports();

  return (
    <Card className="gap-2">
      <CardHeader className="items-center">
        <CardTitle className="text-lg">{t('reports.title')}</CardTitle>
        {openCount === 0 ? null : <Badge variant="warning">{t('reports.openCount', { count: openCount })}</Badge>}
      </CardHeader>
      {isEmpty ? <p className="text-sm text-muted-foreground">{t('reports.none')}</p> : null}
      <ul className="flex flex-col text-sm">
        {reports.map((report) => (
          <ProblemReportItem
            key={report.id}
            report={report}
            isResolving={isResolving}
            onResolve={() => resolve(report.id)}
          />
        ))}
      </ul>
    </Card>
  );
}
