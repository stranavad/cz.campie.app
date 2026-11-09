import { useTurnusOverviewQuery } from '@/core/turnus-overview';

// How full the Turnus is and where its money stands; null while it loads or when it failed to.
export function useOccupancyHero(organisationId: string, turnusId: string) {
  const overview = useTurnusOverviewQuery(organisationId, turnusId, true);

  if (overview.data === undefined) {
    return { isPending: overview.isPending, figures: null };
  }

  const { capacity, registered, registrationsByPaymentStatus, overdueRegistrations, ...money } = overview.data;

  const figures = {
    capacity,
    registered,
    // Negative over capacity, which an admin's Registration may go.
    left: capacity - registered,
    percent: capacity > 0 ? Math.round((registered / capacity) * 100) : null,
    // Overpaid ones are paid in full too.
    paidInFull: registrationsByPaymentStatus.paid + registrationsByPaymentStatus.overpaid,
    // Expected, received, outstanding and overpaid, in whole CZK.
    ...money,
    overdue: overdueRegistrations,
    hasOverpaid: money.overpaid > 0,
    hasOverdue: overdueRegistrations > 0,
  };

  return { isPending: false, figures };
}
