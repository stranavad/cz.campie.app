import net from 'node:net';

const LOOPBACK = ['localhost', '127.0.0.1', '::1'];

const blocked: string[] = [];

// Where a Socket.connect call goes: net.connect hands it its arguments normalized to [options, callback];
// a socket connected by hand gets (options), (port, host) or (path). A Unix socket path never leaves the
// machine, so it has no host.
function destination(args: unknown[]): { host: string; port: unknown } | undefined {
  const first: unknown = Array.isArray(args[0]) ? args[0][0] : args[0];

  if (typeof first === 'object' && first !== null) {
    if ('path' in first && typeof first.path === 'string') {
      return undefined;
    }

    return {
      host: 'host' in first && typeof first.host === 'string' ? first.host : 'localhost',
      port: 'port' in first ? first.port : undefined,
    };
  }

  if (typeof first === 'string' && Number.isNaN(Number(first))) {
    return undefined;
  }

  return { host: typeof args[1] === 'string' ? args[1] : 'localhost', port: first };
}

/**
 * Refuse every TCP connection to a host other than this machine and the given ones, so a test that
 * reaches the outside world, through any client, fails instead of calling it.
 * @param allowedHosts hosts the test services run on
 */
export function guardNetwork(allowedHosts: string[]): void {
  const allowed = new Set([...LOOPBACK, ...allowedHosts]);
  // Read and replaced by reflection: the overloads of connect cannot be named in one signature.
  const connect: unknown = Reflect.get(net.Socket.prototype, 'connect');

  if (typeof connect !== 'function') {
    throw new Error('net.Socket has no connect to guard');
  }

  const guarded = function (this: net.Socket, ...args: unknown[]): net.Socket {
    const target = destination(args);

    if (target !== undefined && !allowed.has(target.host.replace(/^\[(.*)\]$/, '$1'))) {
      blocked.push(`${target.host}:${String(target.port)}`);
      process.nextTick(() => this.destroy(new Error(`Outbound connection to ${target.host} blocked in tests`)));

      return this;
    }

    Reflect.apply(connect, this, args);

    return this;
  };

  Reflect.set(net.Socket.prototype, 'connect', guarded);
}

/**
 * Hand over the connections refused since the last call, and forget them.
 */
export function takeBlockedConnections(): string[] {
  return blocked.splice(0);
}
