import type { GuideIcon } from './types.ts';

// The drawings on the guides' cards and the hub's entry cards, stroke paths on a 24px grid as the design
// draws them.
export const guideIcons = {
  sign: 'M12 3v18M5 6h12l2 2.5-2 2.5H5zM19 13H8l-2 2.5L8 18h11',
  clip: 'M9 4h6v3H9zM7 5.5H5.5V21h13V5.5H17M9 12h6M9 16h4',
  case: 'M3 7h18v13H3zM8 7V4h8v3M3 13h18',
  child: 'M12 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM7 21v-6l-2-4 7 1 7-1-2 4v6M10 21v-4h4v4',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3 2.7-5 6-5s6 2 6 5M16 5.5a3 3 0 0 1 0 5.5M18 15c2 .6 3 2.2 3 5',
  shield: 'M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6zM9 12l2 2 4-4',
  cross: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  tent: 'M3 20 12 4l9 16zM12 4v16M9.5 20 12 15l2.5 5',
  pot: 'M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM2 10h2M20 10h2M9 6c0-1.5 1.5-1.5 1.5-3M13.5 6c0-1.5 1.5-1.5 1.5-3',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4',
  sheet: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5',
} as const satisfies Record<GuideIcon, string>;
