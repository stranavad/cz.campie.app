import { config } from '@/config';
import { resolveHost } from '@/core/host/host.helper';

// The hostname never changes while the app runs, so the mode is resolved once at startup.
export const host = resolveHost(window.location.hostname, config.platformDomain);
