import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Beyond this many characters the text is clipped until the guardian asks for all of it.
const CLIPPED_FROM = 280;

// A Consent's own text, clipped behind "Přečíst celý text" when it is long.
export function ConsentText({ text }: { text: string }) {
  const { t } = useTranslation('portal');
  const [isExpanded, setIsExpanded] = useState(false);
  const textId = useId();
  const isLong = text.length > CLIPPED_FROM;

  return (
    <div className="flex flex-col gap-1.5">
      <p
        id={textId}
        className={cn(
          'rounded-2xl bg-muted px-3.5 py-3 text-sm whitespace-pre-line text-muted-foreground',
          isLong && !isExpanded && 'line-clamp-5',
        )}
      >
        {text}
      </p>
      {isLong ? (
        <Button
          type="button"
          variant="link"
          className="min-h-11 self-start text-sm"
          aria-expanded={isExpanded}
          aria-controls={textId}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? t('consents.readLess') : t('consents.readAll')}
        </Button>
      ) : null}
    </div>
  );
}
