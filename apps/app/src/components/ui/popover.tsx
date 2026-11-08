import { Popover as PopoverPrimitive } from '@base-ui/react/popover';

import { BrandPortalProvider, useBrandPortal } from '@/components/ui/brand-portal';
import { cn } from '@/lib/utils';

function Popover(props: PopoverPrimitive.Root.Props) {
  return (
    <BrandPortalProvider>
      <PopoverPrimitive.Root {...props} />
    </BrandPortalProvider>
  );
}

function PopoverTrigger(props: PopoverPrimitive.Trigger.Props) {
  const [trackBrand] = useBrandPortal();

  return <PopoverPrimitive.Trigger ref={trackBrand} {...props} />;
}

type PopoverContentProps = PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, 'align' | 'side' | 'sideOffset'>;

// A floating card under its trigger: portalled into the trigger's brand, positioned and kept on screen by
// Base UI.
function PopoverContent({
  className,
  align = 'start',
  side = 'bottom',
  sideOffset = 6,
  ...props
}: PopoverContentProps) {
  const [, brandContainer] = useBrandPortal();

  return (
    <PopoverPrimitive.Portal container={brandContainer}>
      <PopoverPrimitive.Positioner align={align} side={side} sideOffset={sideOffset} className="z-50 outline-none">
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            'max-w-[calc(100vw-2rem)] origin-(--transform-origin) rounded-3xl border border-border bg-card p-3 text-foreground shadow-float outline-none transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
