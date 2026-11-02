import { Controller } from '@nestjs/common';

import { getAccountEndpoint, type Account } from '@repo/schema/admins';

import { Access } from '../../../core/access/access.decorator.ts';
import { RequestAdminId } from '../../../core/access/request-actor.decorator.ts';
import { Endpoint } from '../../../core/http/endpoint.decorator.ts';
import { AccountService } from './services/account.service.ts';

@Access('account')
@Controller()
export class AccountController {
  constructor(private readonly accounts: AccountService) {}

  @Endpoint(getAccountEndpoint)
  public get(@RequestAdminId() adminId: string): Promise<Account> {
    return this.accounts.get(adminId);
  }
}
