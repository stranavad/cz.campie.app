// What is picked (a day, an hour) and the button that confirms it: near-black in the admin, the accent on an
// Organisation's pages, whose shell marks itself `data-actions="brand"` (styling.md, two actions colours).
// Popups are portalled into the trigger's branded element, so the mark reaches them too.
export const PICKED_CLASS_NAME =
  'bg-primary font-bold text-primary-foreground hover:bg-primary/85 in-data-[actions=brand]:bg-brand in-data-[actions=brand]:text-brand-foreground in-data-[actions=brand]:hover:bg-brand/85';

// The hours and the quarter hours the time columns offer.
export const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
export const QUARTERS = ['00', '15', '30', '45'];

// Midnight, until a time is picked.
export const DEFAULT_TIME = '00:00';

// The button inside the field that opens the calendar: a 44px thumb target on a phone.
export const TRIGGER_CLASS_NAME =
  'flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-muted text-foreground transition-colors outline-none hover:bg-control focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:cursor-not-allowed disabled:hover:bg-muted sm:size-9 [&_svg]:size-[18px]';
