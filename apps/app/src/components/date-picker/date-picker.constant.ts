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

// The month indexes a year select offers, January first.
export const MONTHS = Array.from({ length: 12 }, (_, month) => month);

// The button inside the field that opens the calendar: a 44px thumb target on a phone.
export const TRIGGER_CLASS_NAME =
  'flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-muted text-foreground transition-colors outline-none hover:bg-control focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:cursor-not-allowed disabled:hover:bg-muted sm:size-9 [&_svg]:size-[18px]';

// An hour or a quarter hour in the time columns.
export const TIME_OPTION_CLASS_NAME =
  'flex min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-[15px] font-medium tabular-nums transition-colors outline-none hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:min-h-9 sm:text-sm';

// The calendar's grid; a picked day's button adds PICKED_CLASS_NAME, today when not picked gets a ring.
export const CALENDAR_CLASS_NAMES = {
  root: 'w-full',
  months: 'w-full',
  month: 'w-full',
  month_caption: 'sr-only',
  month_grid: 'w-full border-collapse',
  weekdays: 'flex',
  weekday: 'flex h-7 flex-1 items-center justify-center text-xs font-bold text-subtle-foreground capitalize',
  week: 'flex',
  day: 'flex flex-1 justify-center p-px',
  day_button:
    'flex size-11 cursor-pointer items-center justify-center rounded-full text-[15px] font-medium tabular-nums transition-colors outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:cursor-not-allowed disabled:hover:bg-transparent sm:size-10 sm:text-sm',
  today: '[&:not([data-selected])>button]:inset-ring-[1.5px] [&:not([data-selected])>button]:inset-ring-foreground',
  outside: '[&>button]:text-subtle-foreground',
  disabled: '[&>button]:text-subtle-foreground [&>button]:line-through',
  hidden: 'invisible',
};
