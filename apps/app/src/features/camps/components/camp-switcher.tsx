import { CheckIcon, ChevronDownIcon, PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { CampSummary } from '@repo/schema/camps';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CampSettingsSection } from '@/features/camps/components/camp-settings/camp-settings-section.constants';
import { useCampSwitcher } from '@/features/camps/components/use-camp-switcher.hook';

interface CampSwitcherProps {
  camps: readonly CampSummary[];
  selectedId: string;
  // The open tab, kept when switching Camps.
  section: CampSettingsSection;
  // Starts a new Camp; undefined when the admin can't, or already is.
  onCreate: (() => void) | undefined;
}

// A quiet "switch" link over the title that lists the Camps, and below them a new one. The chosen Camp goes
// into the address, so a reload keeps it.
export function CampSwitcher({ camps, selectedId, section, onCreate }: CampSwitcherProps) {
  const { t } = useTranslation('camps');
  const switchTo = useCampSwitcher(section);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="-mx-1 flex min-h-11 cursor-pointer items-center gap-1.5 self-start rounded-md px-1 text-sm font-semibold text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-popup-open:text-foreground">
        {camps.length > 1 ? t('settings.switch') : t('switcher')}
        <ChevronDownIcon aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {camps.map((camp) => (
          <DropdownMenuItem key={camp.id} onClick={() => switchTo(camp.id)}>
            <span className="min-w-0 flex-1 truncate">{camp.name}</span>
            {camp.id === selectedId ? (
              <>
                <CheckIcon aria-hidden="true" />
                <span className="sr-only">{t('settings.current')}</span>
              </>
            ) : null}
          </DropdownMenuItem>
        ))}
        {onCreate === undefined ? null : (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreate}>
              <PlusIcon aria-hidden="true" />
              {t('create.title')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
