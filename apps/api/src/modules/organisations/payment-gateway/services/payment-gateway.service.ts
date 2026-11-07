import { Injectable } from '@nestjs/common';

import type { PaymentGatewaySettings, SetPaymentGatewayKeysBody } from '@repo/schema/organisations';

import type { Actor } from '../../../../core/audit/actor.ts';
import { AuditService } from '../../../../core/audit/audit.service.ts';
import { EncryptionService } from '../../../../core/encryption/encryption.service.ts';
import { Clock } from '../../../../core/ports/clock/clock.port.ts';
import type { PaymentGatewayCredentials } from '../../../../core/ports/payment-gateway/payment-gateway.port.ts';
import { PaymentGatewayAccountRepository } from '../../../../repositories/organisations/payment-gateway-account/payment-gateway-account.repository.ts';

// The current Organisation's Comgate keys: the secret is stored encrypted, read only to talk to Comgate,
// and never answered, logged or audited. Permission (Owners only) is the route's.
@Injectable()
export class PaymentGatewayService {
  constructor(
    private readonly accounts: PaymentGatewayAccountRepository,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
    private readonly clock: Clock,
  ) {}

  /**
   * Get the current Organisation's Comgate account as an Owner may see it.
   */
  public async get(): Promise<PaymentGatewaySettings> {
    return { merchantId: (await this.accounts.get())?.merchantId ?? null };
  }

  /**
   * Store the current Organisation's Comgate keys, replacing earlier ones, audited without the secret.
   * @param actor who does it
   * @param body the merchant id and secret
   */
  public async setKeys(actor: Actor, body: SetPaymentGatewayKeysBody): Promise<PaymentGatewaySettings> {
    const before = await this.accounts.get();
    const cipher = await this.encryption.cipher();
    const after = await this.accounts.save({
      merchantId: body.merchantId,
      secret: cipher.encrypt(body.secret),
      updatedAt: this.clock.now(),
    });

    await this.audit.record(actor, {
      action: 'payment_gateway.update',
      target: { type: 'organisation', id: after.organisationId },
      change: { before, after },
    });

    return { merchantId: after.merchantId };
  }

  /**
   * Remove the current Organisation's Comgate keys, audited; card payments end with them.
   * @param actor who does it
   */
  public async removeKeys(actor: Actor): Promise<PaymentGatewaySettings> {
    const before = await this.accounts.get();

    if (before !== null) {
      await this.accounts.remove();
      await this.audit.record(actor, {
        action: 'payment_gateway.remove',
        target: { type: 'organisation', id: before.organisationId },
        change: { before, after: null },
      });
    }

    return { merchantId: null };
  }

  /**
   * Get the current Organisation's Comgate account with its secret decrypted, to talk to Comgate.
   * @returns the account, or null when the Organisation takes no card payments
   */
  public async credentials(): Promise<PaymentGatewayCredentials | null> {
    const account = await this.accounts.get();

    if (account === null) {
      return null;
    }

    return { merchantId: account.merchantId, secret: (await this.encryption.cipher()).decrypt(account.secret) };
  }
}
