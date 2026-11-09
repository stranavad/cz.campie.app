import { ChevronDownIcon, FileTextIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { RegistrationDetail } from '@repo/schema/registrations';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PrihlaskaPdfProps {
  participants: RegistrationDetail['participants'];
}

// Each child's Přihláška PDF: a link for one child, a menu of children for more.
export function PrihlaskaPdf({ participants }: PrihlaskaPdfProps) {
  const { t } = useTranslation('participants');
  const withPdf = participants.flatMap((participant) =>
    participant.prihlaska === null ? [] : [{ ...participant, url: participant.prihlaska.url }],
  );
  const [only] = withPdf;

  if (only === undefined) {
    return null;
  }

  if (withPdf.length === 1) {
    return (
      <a href={only.url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>
        <FileTextIcon aria-hidden="true" />
        {t('detail.prihlaska')}
      </a>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button type="button" variant="outline" />}>
        <FileTextIcon aria-hidden="true" />
        {t('detail.prihlaska')}
        <ChevronDownIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {withPdf.map((participant) => (
          <DropdownMenuItem
            key={participant.id}
            render={(props) => (
              <a {...props} href={participant.url} target="_blank" rel="noreferrer">
                {props.children}
              </a>
            )}
          >
            {t('name', { first: participant.firstName, last: participant.lastName })}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
