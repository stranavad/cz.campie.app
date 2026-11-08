import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Pill buttons. Only colours, the border and a 1px press move transition: cheap to paint on slow phones.
const buttonStyles = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-transparent font-semibold whitespace-nowrap transition-[color,background-color,border-color,transform] duration-150 outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // The main action of a page: near-black, so it reads beside any accent.
        default: 'bg-primary font-bold text-primary-foreground hover:bg-primary/85',
        // The main action on an Organisation's pages (guardians), in its accent.
        brand: 'bg-brand font-bold text-brand-foreground hover:bg-brand/85',
        outline: 'border-control bg-card text-foreground hover:bg-muted aria-expanded:bg-muted',
        secondary: 'bg-muted text-foreground hover:bg-control aria-expanded:bg-control',
        ghost: 'text-foreground hover:bg-muted aria-expanded:bg-muted',
        destructive: 'bg-danger text-danger-foreground hover:bg-danger/70',
        // An add-something placeholder: "+ Sourozenec", "+ Přidat turnus".
        dashed: 'border-dashed border-input bg-transparent text-foreground hover:bg-muted',
        link: 'h-auto rounded-sm px-0 font-semibold text-foreground underline underline-offset-4 hover:text-brand-text',
      },
      size: {
        default: 'h-11 px-4 text-[15px]',
        // Compact on a laptop, still a 44px thumb target on a phone.
        sm: 'h-11 gap-1.5 px-3.5 text-sm sm:h-9',
        lg: 'h-13 px-6 text-base',
        icon: 'size-11',
        'icon-sm': 'size-11 sm:size-9',
      },
    },
    // After the size, so it wins when merged: a link is as tall as its text.
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0 sm:h-auto' }],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

// Merged, so a variant's own overrides (the link's `h-auto px-0`) and a caller's className win over the size
// wherever the classes are used, not only inside <Button>.
type ButtonVariantProps = VariantProps<typeof buttonStyles>;

function buttonVariants(props?: Parameters<typeof buttonStyles>[0]) {
  return cn(buttonStyles(props));
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonStyles>) {
  return <ButtonPrimitive data-slot="button" className={buttonVariants({ variant, size, className })} {...props} />;
}

export { Button, buttonVariants, type ButtonVariantProps };
