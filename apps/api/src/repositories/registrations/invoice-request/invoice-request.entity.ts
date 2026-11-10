import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { InvoiceRequest } from '@repo/schema/registrations';

import type { invoiceRequests } from '../../../db/schema.ts';

export type InvoiceRequestSelectModel = InferSelectModel<typeof invoiceRequests>;
export type InvoiceRequestInsertModel = InferInsertModel<typeof invoiceRequests>;

export class InvoiceRequestEntity {
  public readonly id: string;
  public readonly registrationId: string;
  public readonly companyName: string;
  public readonly ico: string;
  public readonly dic: string | null;
  public readonly street: string;
  public readonly city: string;
  public readonly postcode: string;
  public readonly email: string | null;
  public readonly note: string | null;
  public readonly amount: number;
  public readonly invoicedOn: string | null;
  public readonly invoiceNumber: string | null;

  constructor(row: InvoiceRequestSelectModel) {
    this.id = row.id;
    this.registrationId = row.registrationId;
    this.companyName = row.companyName;
    this.ico = row.ico;
    this.dic = row.dic;
    this.street = row.street;
    this.city = row.city;
    this.postcode = row.postcode;
    this.email = row.email;
    this.note = row.note;
    this.amount = row.amount;
    this.invoicedOn = row.invoicedOn;
    this.invoiceNumber = row.invoiceNumber;
  }

  toDto(): InvoiceRequest {
    return {
      companyName: this.companyName,
      ico: this.ico,
      dic: this.dic,
      street: this.street,
      city: this.city,
      postcode: this.postcode,
      email: this.email,
      note: this.note,
      amount: this.amount,
      invoicedOn: this.invoicedOn,
      invoiceNumber: this.invoiceNumber,
    };
  }
}
