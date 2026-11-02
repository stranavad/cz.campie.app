import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { UnitOfWork } from '../../../core/database/unit-of-work.ts';
import { operators } from '../../../db/schema.ts';

// Read only: the API's role cannot write the table, so the operator command line is the only way in.
@Injectable()
export class OperatorRepository {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  /**
   * Tell whether an admin is the Platform operator.
   * @param adminId admin id
   */
  public async isOperator(adminId: string): Promise<boolean> {
    const [row] = await this.unitOfWork.db.select().from(operators).where(eq(operators.adminId, adminId));

    return row !== undefined;
  }
}
