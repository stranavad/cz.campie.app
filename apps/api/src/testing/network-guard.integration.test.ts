import { once } from 'node:events';
import net from 'node:net';
import { describe, expect, it } from 'vitest';

import { takeBlockedConnections } from './network-guard.ts';

describe('network guard', () => {
  it('refuses every connection beyond this machine and reports it', async () => {
    const socket = net.connect(443, 'campie.example');
    const [error] = await once(socket, 'error');

    await expect(fetch('https://payment-gateway.example/api')).rejects.toThrow('fetch failed');

    expect(error).toMatchObject({ message: expect.stringMatching(/blocked/) });
    expect(takeBlockedConnections()).toEqual(['campie.example:443', 'payment-gateway.example:443']);
  });

  it('lets connections to this machine through', async () => {
    const server = net.createServer((socket) => socket.end());
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const { port } = server.address() as net.AddressInfo;

    const socket = net.connect(port, 'localhost');
    await once(socket, 'connect');

    socket.destroy();
    server.close();
    expect(takeBlockedConnections()).toEqual([]);
  });
});
