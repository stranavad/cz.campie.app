import { EmailLayout } from '../../../core/emails/email-layout.tsx';
import { defineEmail } from '../../../core/emails/email.service.ts';

const fact = { margin: '0 0 6px', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '15px', lineHeight: '22px' };

export interface JobFailedProps {
  readonly job: string;
  readonly jobId: string | null;
  readonly organisationId: string | null;
}

// Tells the Platform operator a job gave up, by ids only: the queue's failed set and the log hold the rest.
export const JobFailedEmail = defineEmail<JobFailedProps>({
  stream: 'notification',
  subject: ({ job }) => `Úloha selhala: ${job}`,
  render: ({ brand, job, jobId, organisationId }) => (
    <EmailLayout brand={brand} title="Úloha selhala" preview={job}>
      <p style={fact}>
        <strong>Úloha:</strong> {job}
      </p>
      <p style={fact}>
        <strong>Id úlohy:</strong> {jobId ?? '-'}
      </p>
      <p style={fact}>
        <strong>Organizace:</strong> {organisationId ?? '-'}
      </p>
      <p style={fact}>
        Úloha vyčerpala všechny pokusy a zůstává 30 dní mezi neúspěšnými úlohami ve frontě. Další selhání stejné úlohy
        během hodiny už e-mailem nehlásíme, najdete je v logu.
      </p>
    </EmailLayout>
  ),
});
