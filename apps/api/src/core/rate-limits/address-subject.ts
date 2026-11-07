import { isIPv4, isIPv6 } from 'node:net';

const IPV6_GROUPS = 8;
const NETWORK_GROUPS = 4;
const MAPPED_PREFIX = [0, 0, 0, 0, 0, 0xffff];

/**
 * Turn a client's IP address into what an IP limit counts. An IPv6 client usually holds a whole /64
 * network and can pick any address in it, so the network counts as one; an IPv4-mapped address counts as
 * its IPv4 address, so a dual-stack listener counts one client once.
 * @param address the address as Express reports it
 */
export function addressSubject(address: string): string {
  const bare = address.split('%')[0] ?? address;

  if (!isIPv6(bare)) {
    return address;
  }

  const groups = expandIPv6(bare);

  if (MAPPED_PREFIX.every((group, index) => groups[index] === group)) {
    return [groups[6] ?? 0, groups[7] ?? 0].flatMap((group) => [group >> 8, group & 0xff]).join('.');
  }

  return `${groups
    .slice(0, NETWORK_GROUPS)
    .map((group) => group.toString(16))
    .join(':')}::/64`;
}

// The eight 16-bit groups of a valid IPv6 address; an embedded IPv4 tail fills the last two.
function expandIPv6(address: string): number[] {
  const groupsOf = (part: string): number[] =>
    part === '' ? [] : part.split(':').flatMap((group) => (isIPv4(group) ? ipv4Groups(group) : [parseInt(group, 16)]));
  const [head = '', tail] = address.split('::');
  const headGroups = groupsOf(head);
  const tailGroups = tail === undefined ? [] : groupsOf(tail);
  const zeros = Array.from({ length: IPV6_GROUPS - headGroups.length - tailGroups.length }, () => 0);

  return [...headGroups, ...zeros, ...tailGroups];
}

function ipv4Groups(address: string): number[] {
  const [a = 0, b = 0, c = 0, d = 0] = address.split('.').map(Number);

  return [(a << 8) | b, (c << 8) | d];
}
