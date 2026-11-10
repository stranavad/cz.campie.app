// Stroke icons from the design, drawn on a 24px grid with round caps and joins.
export const icons = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  check: 'M20 6 9 17l-5-5',
  chevron: 'm6 9 6 6 6-6',
  close: 'M18 6 6 18M6 6l12 12',
  menu: 'M4 7h16M4 12h16M4 17h16',
  plus: 'M12 5v14M5 12h14',
  qr: 'M4 3h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM4 13h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1zM14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4M20 17v3',
  // The platform's mark: a tent.
  tent: 'M3.5 21 14 3M20.5 21 10 3M2 21h20',
  // The tent with its door, as the admin interface draws a Camp.
  camp: 'M3.5 21 14 3M20.5 21 10 3M15.5 21 12 15l-3.5 6M2 21h20',
} as const;

export type IconName = keyof typeof icons;

// A filled QR code on a 13px grid, as the design draws a payment code.
export const qrCodePath =
  'M0 0h5v5H0zM1 1v3h3V1zM8 0h5v5H8zM9 1v3h3V1zM0 8h5v5H0zM1 9v3h3V9zM2 2h1v1H2zM10 2h1v1h-1zM2 10h1v1H2zM6 0h1v2H6zM6 3h1v1H6zM6 5h2v1H6zM0 6h2v1H0zM3 6h2v1H3zM9 6h1v1H9zM11 6h2v1h-2zM6 7h1v2H6zM8 8h2v1H8zM11 8h1v2h-1zM7 10h2v1H7zM10 10h1v1h-1zM6 12h2v1H6zM9 12h1v1H9zM11 11h2v2h-2z';
