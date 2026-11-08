import { createContext, use, useState, type ReactNode } from 'react';

// Popups are portalled out of the page, which would leave the Organisation's or Camp's accent behind: they
// render instead into their trigger's nearest branded element (`brandAttributes`), or the body outside one.
// The first item goes on the trigger as its ref, the second to the popup's portal as its container.
function useBrandContainer() {
  const [container, setContainer] = useState<HTMLElement | undefined>(undefined);
  const track = (trigger: HTMLElement | null) =>
    setContainer(trigger?.closest<HTMLElement>('[data-brand]') ?? undefined);

  return [track, container] as const;
}

const BrandPortalContext = createContext<ReturnType<typeof useBrandContainer>>([() => undefined, undefined]);

// Shares one trigger's branded container with the popup of the same root (Popover, Dialog).
function BrandPortalProvider({ children }: { children: ReactNode }) {
  return <BrandPortalContext value={useBrandContainer()}>{children}</BrandPortalContext>;
}

function useBrandPortal() {
  return use(BrandPortalContext);
}

export { BrandPortalProvider, useBrandContainer, useBrandPortal };
