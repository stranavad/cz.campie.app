import { Reflector } from '@nestjs/core';

// Who may call a controller's routes, and where their Organisation comes from:
// - public: anyone on an Organisation's subdomain; the Organisation is the host's.
// - guardian: a guardian session on an Organisation's subdomain, of the host's Organisation.
// - admin: an admin session on the main host; the Organisation is named in a header and must be one the
//   admin is a member of.
// - account: an admin session on the main host, outside any Organisation: the admin's own identity and
//   memberships, before an Organisation is chosen.
// - platform: anyone on the main host, outside any Organisation (signup, login).
// - gateway: a payment gateway's notification; the Organisation is in the path, and the gateway's
//   signature, checked by the route, is the permission.
// - unscoped: anyone anywhere; the route opens its own unit of work if it needs one (health, download
//   links whose signed token is the permission).
export const ACCESS_KINDS = ['public', 'guardian', 'admin', 'account', 'platform', 'gateway', 'unscoped'] as const;

export type AccessKind = (typeof ACCESS_KINDS)[number];

// Declared on every controller; the app refuses to boot with one that has none.
export const Access = Reflector.createDecorator<AccessKind>();

// The path parameter a gateway route names its Organisation in.
export const GATEWAY_ORGANISATION_PARAM = 'organisationId';
