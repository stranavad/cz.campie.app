// How Czech readers write dates and money, for pages, emails and documents alike.

/**
 * Write a calendar date as Czech readers write it.
 * @param date YYYY-MM-DD
 */
export function czechDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);

  return `${day}. ${month}. ${year}`;
}

/**
 * Write the Prague date and time of an instant as Czech readers do.
 * @param instant the instant, or its ISO string
 */
export function czechDateTime(instant: Date | string): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    timeZone: 'Europe/Prague',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(instant));
}

/**
 * Write whole CZK as Czech readers write money.
 * @param amount whole CZK
 */
export function czk(amount: number): string {
  return `${new Intl.NumberFormat('cs-CZ').format(amount)} Kč`;
}
