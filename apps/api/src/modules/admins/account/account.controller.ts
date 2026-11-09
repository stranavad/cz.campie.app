import { Controller } from '@nestjs/common';

import {
  changePasswordEndpoint,
  getAccountEndpoint,
  updateAccountEndpoint,
  type Account,
  type ChangePasswordBody,
  type UpdateAccountBody,
} from '@repo/schema/admins';

import { Access } from '../../../core/access/access.decorator.ts';
import { RequestActor, RequestAdminId, RequestAdminSession } from '../../../core/access/request-actor.decorator.ts';
import type { Actor } from '../../../core/audit/actor.ts';
import { Endpoint, EndpointBody } from '../../../core/http/endpoint.decorator.ts';
import { AccountService } from './services/account.service.ts';

@Access('account')
@Controller()
export class AccountController {
  constructor(private readonly accounts: AccountService) {}

  @Endpoint(getAccountEndpoint)
  public get(
    @RequestAdminId() adminId: string,
    @RequestAdminSession() session: { secondFactor: boolean },
  ): Promise<Account> {
    return this.accounts.get(adminId, session);
  }

  @Endpoint(updateAccountEndpoint)
  public update(
    @RequestActor() actor: Actor,
    @RequestAdminSession() session: { secondFactor: boolean },
    @EndpointBody(updateAccountEndpoint) body: UpdateAccountBody,
  ): Promise<void> {
    return this.accounts.rename(actor, session, body);
  }

  @Endpoint(changePasswordEndpoint)
  public changePassword(
    @RequestActor() actor: Actor,
    @RequestAdminSession() session: { id: string; secondFactor: boolean },
    @EndpointBody(changePasswordEndpoint) body: ChangePasswordBody,
  ): Promise<void> {
    return this.accounts.changePassword(actor, session, body);
  }
}
