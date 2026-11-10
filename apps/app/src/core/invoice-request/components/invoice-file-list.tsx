import { FileTextIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { InvoiceFile } from '@repo/schema/registrations';
import { czechDateTime } from '@repo/schema/shared';

interface InvoiceFileListProps {
  files: readonly InvoiceFile[];
}

// The invoices the camp uploaded to an Invoice request, oldest first, each opening through its short-lived
// link.
export function InvoiceFileList({ files }: InvoiceFileListProps) {
  const { t } = useTranslation('common', { keyPrefix: 'invoiceRequest' });

  if (files.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {files.map((invoice) => (
        <li key={invoice.id} className="flex flex-wrap items-center gap-x-2">
          <FileTextIcon className="size-4 text-muted-foreground" aria-hidden />
          <a href={invoice.file.url} target="_blank" rel="noreferrer" className="font-semibold underline">
            {invoice.name}
          </a>
          <span className="text-[13px] text-muted-foreground">
            {t('uploadedAt', { date: czechDateTime(invoice.uploadedAt) })}
          </span>
        </li>
      ))}
    </ul>
  );
}
