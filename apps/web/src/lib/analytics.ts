import type { Href } from '../content/types.ts';

// Umami counts a click on any element carrying data-umami-event, with each data-umami-event-* as a
// property. These are the platform links worth counting, and where on the page they sit.
const LINK_EVENTS: Partial<Record<Href, string>> = {
  'app:/registrace-organizace': 'signup',
  'app:/prihlaseni': 'login',
};

export type LinkPlace = 'header' | 'menu' | 'hero' | 'cta-band';

export function linkEvent(target: Href, place: LinkPlace): Record<string, string> {
  const event = LINK_EVENTS[target];
  return event === undefined ? {} : { 'data-umami-event': event, 'data-umami-event-place': place };
}

// Events sent from the site's scripts; without Umami loaded (every build but production) they are no-ops.
declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, string>) => void };
  }
}

export function trackEvent(event: 'contact-sent'): void {
  window.umami?.track(event);
}
