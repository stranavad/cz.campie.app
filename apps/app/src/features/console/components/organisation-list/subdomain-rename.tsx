import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { ConsoleOrganisation } from '@repo/schema/console';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OrganisationRowState } from '@/features/console/components/organisation-list/use-organisation-row.hook';

interface SubdomainRenameProps {
  organisation: ConsoleOrganisation;
  row: OrganisationRowState;
}

// A pending Organisation's subdomain, which the operator may still change before approving it.
export function SubdomainRename({ organisation, row }: SubdomainRenameProps) {
  const { t } = useTranslation('console');
  const id = useId();

  return (
    <form
      className="flex max-w-lg flex-col gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        row.rename();
      }}
    >
      <Label htmlFor={id}>{t('rename.label')}</Label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={id}
          className="flex-[1_1_12rem]"
          value={row.subdomain}
          onChange={(event) => row.setSubdomain(event.target.value)}
          disabled={row.isBusy}
        />
        <Button type="submit" variant="outline" disabled={row.isBusy || row.subdomain === organisation.subdomain}>
          {t('rename.submit')}
        </Button>
      </div>
    </form>
  );
}
