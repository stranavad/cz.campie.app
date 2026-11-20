// Stroke icons from the design, drawn on a 24px grid with round caps and joins.
export const icons = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  check: 'M20 6 9 17l-5-5',
  chevron: 'm6 9 6 6 6-6',
  close: 'M18 6 6 18M6 6l12 12',
  menu: 'M4 7h16M4 12h16M4 17h16',
  plus: 'M12 5v14M5 12h14',
  // A browser window: a website.
  browser: 'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 9h18',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5',
  qr: 'M4 3h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM4 13h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1zM14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4M20 17v3',
  // The platform's mark: a tent.
  tent: 'M3.5 21 14 3M20.5 21 10 3M2 21h20',
  // The tent with its door, as the admin interface draws a Camp.
  camp: 'M3.5 21 14 3M20.5 21 10 3M15.5 21 12 15l-3.5 6M2 21h20',
  // Weby pro tábory: what the organiser gets, and the form's alert.
  pencil: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  sync: 'M4 12a8 8 0 0 1 13.7-5.7L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.7L4 15.5M4 20v-4.5h4.5',
  redirect: 'M4 7h9a5 5 0 0 1 0 10H9M4 7l4-4M4 7l4 4',
  bolt: 'M13 3 5 13h6l-1 8 8-10h-6z',
  alert: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 8v5M12 16.5v.01',
  tick: 'm5 12.5 4.5 4.5L19 7.5',
  // The kit's template page and configurator.
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  down: 'M12 5v14M6 13l6 6 6-6',
  lock: 'M7 10h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 10V7a4 4 0 0 1 8 0v3',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 7v5l3 2',
  image: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 16l5-5 4 4 3-3 6 6',
  undo: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4',
  phoneCheck:
    'M9.5 2.5h5A2.5 2.5 0 0 1 17 5v14a2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 7 19V5a2.5 2.5 0 0 1 2.5-2.5zM9.5 12l2 2 3.5-4',
} as const;

export type IconName = keyof typeof icons;

// A filled QR code on a 13px grid, as the design draws a payment code.
export const qrCodePath =
  'M0 0h5v5H0zM1 1v3h3V1zM8 0h5v5H8zM9 1v3h3V1zM0 8h5v5H0zM1 9v3h3V9zM2 2h1v1H2zM10 2h1v1h-1zM2 10h1v1H2zM6 0h1v2H6zM6 3h1v1H6zM6 5h2v1H6zM0 6h2v1H0zM3 6h2v1H3zM9 6h1v1H9zM11 6h2v1h-2zM6 7h1v2H6zM8 8h2v1H8zM11 8h1v2h-1zM7 10h2v1H7zM10 10h1v1h-1zM6 12h2v1H6zM9 12h1v1H9zM11 11h2v2h-2z';
