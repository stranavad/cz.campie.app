import { z } from 'zod';

import { defineEndpoint } from '@repo/schema/shared';

// The Organisation's Comgate account as an Owner sees it: the merchant id only, never the secret.
export const paymentGatewaySettingsSchema = z.object({
  // null while the Organisation has no keys: no card payment, bank transfer only.
  merchantId: z.string().nullable(),
});

export type PaymentGatewaySettings = z.infer<typeof paymentGatewaySettingsSchema>;

// The current Organisation's Comgate account; Owners only.
export const getPaymentGatewaySettingsEndpoint = defineEndpoint({
  method: 'GET',
  path: '/organisation-settings/payment-gateway',
  response: paymentGatewaySettingsSchema,
});

export const setPaymentGatewayKeysBodySchema = z.object({
  merchantId: z
    .string()
    .trim()
    .regex(/^\d{1,16}$/, 'payment_gateway_merchant_invalid'),
  secret: z.string().trim().min(8).max(128),
});

export type SetPaymentGatewayKeysBody = z.infer<typeof setPaymentGatewayKeysBodySchema>;

// Stores the Organisation's Comgate keys encrypted, replacing any earlier ones, audited; the secret is
// never answered again. Owners only.
export const setPaymentGatewayKeysEndpoint = defineEndpoint({
  method: 'PUT',
  path: '/organisation-settings/payment-gateway',
  body: setPaymentGatewayKeysBodySchema,
  response: paymentGatewaySettingsSchema,
});

// Removes the Organisation's Comgate keys, which ends card payments, audited. Owners only.
export const removePaymentGatewayKeysEndpoint = defineEndpoint({
  method: 'DELETE',
  path: '/organisation-settings/payment-gateway',
  response: paymentGatewaySettingsSchema,
});
