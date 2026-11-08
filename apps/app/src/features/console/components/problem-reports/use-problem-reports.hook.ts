import { useProblemReportsQuery, useResolveProblemReportMutation } from '@/features/console/api/console.queries';

export function useProblemReports() {
  const reports = useProblemReportsQuery();
  const resolve = useResolveProblemReportMutation();
  const list = reports.data ?? [];

  return {
    reports: list,
    isEmpty: reports.data?.length === 0,
    openCount: list.filter((report) => report.resolvedAt === null).length,
    isResolving: resolve.isPending,
    resolve: (reportId: string) => resolve.mutate(reportId),
  };
}
