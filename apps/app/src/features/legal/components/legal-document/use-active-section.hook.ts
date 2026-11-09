import { useEffect, useState } from 'react';

import { sectionAnchor } from '@/features/legal/components/legal-document/section-anchor.helper';

/**
 * Tell which section of a legal text is being read: the last one showing in the top third of the window.
 * An IntersectionObserver, not a scroll listener, so scrolling stays smooth on old phones.
 * @param count how many sections the text has
 */
export function useActiveSection(count: number) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const sections = Array.from({ length: count }, (_, index) => document.getElementById(sectionAnchor(index)));
    const showing = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = sections.indexOf(entry.target as HTMLElement);

          if (entry.isIntersecting) {
            showing.add(index);
          } else {
            showing.delete(index);
          }
        }

        if (showing.size > 0) {
          setActive(Math.max(...showing));
        }
      },
      { rootMargin: '0px 0px -66% 0px' },
    );

    for (const section of sections) {
      if (section !== null) {
        observer.observe(section);
      }
    }

    return () => observer.disconnect();
  }, [count]);

  return active;
}
