import { Injectable } from '@nestjs/common';

import type { AdminEntity } from '../../../../repositories/admins/admin/admin.entity.ts';
import { AdminRepository } from '../../../../repositories/admins/admin/admin.repository.ts';

@Injectable()
export class AdminService {
  constructor(private readonly admins: AdminRepository) {}

  /**
   * Create an admin identity, in any unit of work: it belongs to no Organisation.
   * @param input the admin
   */
  public create(input: { email: string }): Promise<AdminEntity> {
    return this.admins.create(input);
  }
}
