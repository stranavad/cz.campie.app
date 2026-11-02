import { Injectable } from '@nestjs/common';

import type { AdminEntity } from '../../../../repositories/admins/admin/admin.entity.ts';
import { AdminRepository } from '../../../../repositories/admins/admin/admin.repository.ts';

@Injectable()
export class AdminService {
  constructor(private readonly admins: AdminRepository) {}

  /**
   * Get an admin by id, or throw if missing.
   * @param id admin id
   */
  public getByIdOrThrow(id: string): Promise<AdminEntity> {
    return this.admins.getByIdOrThrow(id);
  }

  /**
   * Get the admin an email belongs to.
   * @param email the email, lowercase
   */
  public getByEmail(email: string): Promise<AdminEntity | null> {
    return this.admins.getByEmail(email);
  }

  /**
   * Create an admin identity, in any unit of work: it belongs to no Organisation.
   * @param input the admin's email, and their password's hash unless they set one later
   */
  public create(input: { email: string; passwordHash?: string }): Promise<AdminEntity> {
    return this.admins.create(input);
  }
}
