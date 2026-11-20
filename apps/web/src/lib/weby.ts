// An amount of whole crowns as Weby pro tábory shows it: "4 700 Kč", with non-breaking spaces.
const crowns = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });

export function czk(amount: number): string {
  return `${crowns.format(amount)} Kč`;
}
