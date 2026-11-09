import { Menu as MenuPrimitive } from '@base-ui/react/menu';

import { BrandPortalProvider, useBrandPortal } from '@/components/ui/brand-portal';
import { cn } from '@/lib/utils';

// A list of actions behind a button (a record's "…" menu). Keyboard, typeahead and focus return come from
// Base UI; the popup renders into the trigger's brand like Popover.
function DropdownMenu(props: MenuPrimitive.Root.Props) {
  return (
    <BrandPortalProvider>
      <MenuPrimitive.Root {...props} />
    </BrandPortalProvider>
  );
}

// Style it with `render={<Button variant="outline" size="icon" />}` or `className={buttonVariants(...)}`.
function DropdownMenuTrigger(props: MenuPrimitive.Trigger.Props) {
  const [trackBrand] = useBrandPortal();

  return <MenuPrimitive.Trigger ref={trackBrand} data-slot="dropdown-menu-trigger" {...props} />;
}

type DropdownMenuContentProps = MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, 'align' | 'side' | 'sideOffset'>;

function DropdownMenuContent({
  className,
  align = 'end',
  side = 'bottom',
  sideOffset = 6,
  ...props
}: DropdownMenuContentProps) {
  const [, brandContainer] = useBrandPortal();

  return (
    <MenuPrimitive.Portal container={brandContainer}>
      <MenuPrimitive.Positioner align={align} side={side} sideOffset={sideOffset} className="z-50 outline-none">
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            'max-h-(--available-height) max-w-[calc(100vw-2rem)] min-w-48 origin-(--transform-origin) overflow-y-auto rounded-2xl border border-border bg-card p-1.5 text-foreground shadow-float outline-none transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

// `destructive` for an action that loses data (cancel, erase): danger text, danger tint when highlighted.
function DropdownMenuItem({
  className,
  variant = 'default',
  ...props
}: MenuPrimitive.Item.Props & { variant?: 'default' | 'destructive' }) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-variant={variant}
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-[15px] text-foreground outline-none select-none data-disabled:cursor-not-allowed data-disabled:opacity-45 data-highlighted:bg-muted sm:min-h-9 data-[variant=destructive]:text-danger-foreground data-[variant=destructive]:data-highlighted:bg-danger [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('-mx-1.5 my-1.5 h-px bg-border', className)}
      {...props}
    />
  );
}

export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger };
