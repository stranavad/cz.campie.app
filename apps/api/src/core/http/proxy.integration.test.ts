import { describe, expect, it } from 'vitest';

import { ACCESS_HEADERS } from '@repo/schema/shared';

import { mainHost } from '../../testing/fixtures.ts';
import { useTestApp } from '../../testing/test-app.ts';
import { PROXY_SECRET_HEADER } from './proxy-secret.ts';

const PROXY_SECRET = 'test-only-proxy-secret-0123456789abcdef';
const REFUSED = { statusCode: 403, message: 'Forbidden' };

describe('proxy secret', () => {
  const { http } = useTestApp({ env: { PROXY_SECRET } });

  it('refuses a request without the secret before any route runs, webhooks included', async () => {
    const health = await http().get('/api/health');
    const webhook = await http().post('/api/webhooks/mail').set('content-type', 'application/json').send('{}');
    const unknown = await http().get('/api/no-such-route');

    for (const response of [health, webhook, unknown]) {
      expect(response.status).toBe(403);
      expect(response.body).toEqual(REFUSED);
    }
  });

  it('refuses a wrong secret, one that only starts like the right one included', async () => {
    for (const secret of ['wrong', `${PROXY_SECRET}x`, PROXY_SECRET.slice(0, -1), '']) {
      const response = await http().get('/api/health').set(PROXY_SECRET_HEADER, secret);

      expect(response.status).toBe(403);
      expect(response.body).toEqual(REFUSED);
    }
  });

  it('admits a request with the secret', async () => {
    const response = await http().get('/api/health').set(PROXY_SECRET_HEADER, PROXY_SECRET);

    expect(response.status).toBe(200);
  });
});

describe('client address behind two proxies', () => {
  const { app, http } = useTestApp({ env: { TRUST_PROXY_HOPS: '2', PASSWORD_RESET_LIMIT_PER_IP: '2' } });

  // The client may send any X-Forwarded-For; the edge proxy appends the client's address and the frontend's
  // proxy the edge proxy's, while the frontend's proxy itself is the connection's peer.
  const requestReset = (forgedAddress: string, clientAddress: string) =>
    http()
      .post('/api/password-resets')
      .set({
        Host: mainHost(app()),
        [ACCESS_HEADERS.csrf]: '1',
        'X-Forwarded-For': `${forgedAddress}, ${clientAddress}, 10.0.1.5`,
      })
      .send({ email: 'nikdo@example.com' });

  it('counts the address the edge proxy saw, whatever the client put before it', async () => {
    expect((await requestReset('192.0.2.1', '198.51.100.7')).status).toBe(204);
    expect((await requestReset('192.0.2.2', '198.51.100.7')).status).toBe(204);

    expect((await requestReset('192.0.2.3', '198.51.100.7')).status).toBe(429);
    expect((await requestReset('192.0.2.4', '203.0.113.9')).status).toBe(204);
  });
});
