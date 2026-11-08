import { useEffect, useRef } from 'react';

// The sidebar's breakpoint (Tailwind's `lg`), from where the drawer is hidden.
const WIDE = '(min-width: 64rem)';

// The phone drawer: a native modal <dialog>. Widening past the sidebar's breakpoint (a tablet turned)
// closes it, or the hidden dialog would keep the page inert.
export function useDrawer() {
  const drawer = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const wide = window.matchMedia(WIDE);
    const close = () => {
      if (wide.matches) {
        drawer.current?.close();
      }
    };

    wide.addEventListener('change', close);

    return () => wide.removeEventListener('change', close);
  }, []);

  return {
    drawer,
    open: () => drawer.current?.showModal(),
    close: () => drawer.current?.close(),
  };
}
