import { useTranslation } from 'react-i18next';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Each provider that stores or processes data, what for, which data and where.
export function ProcessorList() {
  const { t } = useTranslation('legal');
  const rows = t('processors.rows', { returnObjects: true });

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-2xl leading-tight font-bold tracking-[-0.02em] sm:text-[26px]">{t('processors.title')}</h2>
      <Table className="min-w-[44rem] text-[15px] leading-normal">
        <TableHeader>
          <TableRow>
            <TableHead>{t('processors.name')}</TableHead>
            <TableHead>{t('processors.purpose')}</TableHead>
            <TableHead>{t('processors.data')}</TableHead>
            <TableHead>{t('processors.location')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell className="w-44 align-top font-semibold">{row.name}</TableCell>
              <TableCell className="align-top">{row.purpose}</TableCell>
              <TableCell className="align-top">{row.data}</TableCell>
              <TableCell className="w-40 align-top text-muted-foreground">{row.location}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
