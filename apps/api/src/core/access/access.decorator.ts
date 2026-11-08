import { Reflector } from '@nestjs/core';

// Who may call a controller's routes, and where their Organisation comes from:
// - public: anyone on an Organisation's subdomain; the Organisation is the host's.
// - guardian: a guardian session on an Organisation's subdomain, of the host's Organisation.
// - admin: an admin session on the main host; the Organisation is named in a header and must be one the
//   admin is a member of.
// - account: an admin session on the main host, outside any Organisation: the admin's own identity and
//   memberships, before an Organisation is chosen.
// - operator: the Platform operator's console on the main host, outside any Organisation: an admin session
//   that passed a TOTP code, of an admin with the operator flag, checked on every request. Its unit of work
//   cannot enter an Organisation, so no Organisation's own data is within its reach.
// - operator-preview: the Platform operator, as for the console, looking at the public pages of an
//   Organisation awaiting approval, named in the path. It runs in that Organisation's unit of work, so its
//   routes show public data only; everything else of the Organisation stays behind a support grant.
// - platform: anyone on the main host, outside any Organisation (signup, login).
// - gateway: a payment gateway's notification; the Organisation is in the path, and the gateway's
//   signature, checked by the route, is the permission.
// - webhook: an outside service's notification without an Organisation in the path (the mail provider's);
//   no CSRF header, since it calls server to server; the route checks the service's signature, the
//   permission, and opens its own unit of work.
// - unscoped: anyone anywhere; the route opens its own unit of work if it needs one (health, download
//   links whose signed token is the permission).
export const ACCESS_KINDS = [
  'public',
  'guardian',
  'admin',
  'account',
  'operator',
  'operator-preview',
  'platform',
  'gateway',
  'webhook',
  'unscoped',
] as const;

export type AccessKind = (typeof ACCESS_KINDS)[number];

// Declared on every controller; the app refuses to boot with one that has none.
export const Access = Reflector.createDecorator<AccessKind>();

// The path parameter a gateway or operator-preview route names its Organisation in.
export const PATH_ORGANISATION_PARAM = 'organisationId';
