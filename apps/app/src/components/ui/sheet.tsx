import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import { XIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { BrandPortalProvider, useBrandPortal } from '@/components/ui/brand-portal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function Sheet(props: SheetPrimitive.Root.Props) {
  return (
    <BrandPortalProvider>
      <SheetPrimitive.Root {...props} />
    </BrandPortalProvider>
  );
}

function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  const [trackBrand] = useBrandPortal();

  return <SheetPrimitive.Trigger ref={trackBrand} {...props} />;
}

// A modal panel sliding up from the bottom edge, for choices made with a thumb on a phone; portalled into
// the trigger's brand. Focus, Escape, the backdrop tap and scroll lock come from Base UI (it is a Dialog).
function SheetContent({ className, children, ...props }: SheetPrimitive.Popup.Props) {
  const [, brandContainer] = useBrandPortal();

  return (
    <SheetPrimitive.Portal container={brandContainer}>
      <SheetPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh-2rem)] flex-col gap-3 overflow-y-auto overscroll-contain rounded-t-[1.75rem] border-t border-border bg-card px-4 pt-2.5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-foreground shadow-float outline-none transition-[translate] duration-200 ease-out data-ending-style:translate-y-full data-starting-style:translate-y-full sm:mx-auto sm:max-w-lg',
          className,
        )}
        {...props}
      >
        <span aria-hidden="true" className="h-1.5 w-10 shrink-0 self-center rounded-full bg-input/50" />
        {children}
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  );
}

// The sheet's title row with its close button.
function SheetHeader({ className, children, ...props }: ComponentProps<'div'>) {
  const { t } = useTranslation();

  return (
    <div data-slot="sheet-header" className={cn('flex items-center justify-between gap-3', className)} {...props}>
      {children}
      <SheetPrimitive.Close
        render={<Button type="button" variant="secondary" size="icon" aria-label={t('sheet.close')} />}
      >
        <XIcon aria-hidden="true" className="size-5" />
      </SheetPrimitive.Close>
    </div>
  );
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn('text-heading', className)} {...props} />;
}

function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

const SheetClose = SheetPrimitive.Close;

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger };
