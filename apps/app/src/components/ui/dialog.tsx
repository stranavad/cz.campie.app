import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';

import { BrandPortalProvider, useBrandPortal } from '@/components/ui/brand-portal';
import { cn } from '@/lib/utils';

function Dialog(props: DialogPrimitive.Root.Props) {
  return (
    <BrandPortalProvider>
      <DialogPrimitive.Root {...props} />
    </BrandPortalProvider>
  );
}

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  const [trackBrand] = useBrandPortal();

  return <DialogPrimitive.Trigger ref={trackBrand} {...props} />;
}

// A modal card over a dimmed page, portalled into the trigger's brand. Focus, Escape, the backdrop click and
// scroll lock come from Base UI.
function DialogContent({ className, ...props }: DialogPrimitive.Popup.Props) {
  const [, brandContainer] = useBrandPortal();

  return (
    <DialogPrimitive.Portal container={brandContainer}>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-3xl border border-border bg-card p-5 text-foreground shadow-float outline-none transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-6',
          className,
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn('text-heading', className)} {...props} />;
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

const DialogClose = DialogPrimitive.Close;

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger };
