import { MoonIcon, SunIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

// Switches between the light and the dark theme; the choice is kept in this browser.
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const label = theme === 'dark' ? t('theme.toLight') : t('theme.toDark');

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('text-muted-foreground hover:text-foreground', className)}
      aria-label={label}
      title={label}
      onClick={toggleTheme}
    >
      {theme === 'dark' ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
    </Button>
  );
}
