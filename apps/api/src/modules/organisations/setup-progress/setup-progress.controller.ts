import { Controller } from '@nestjs/common';

import { getSetupProgressEndpoint, type GetSetupProgressResponse } from '@repo/schema/organisations';

import { Access } from '../../../core/access/access.decorator.ts';
import { Requires } from '../../../core/access/permission.ts';
import { Endpoint } from '../../../core/http/endpoint.decorator.ts';
import { SetupProgressService } from './services/setup-progress.service.ts';

@Access('admin')
@Controller()
export class SetupProgressController {
  constructor(private readonly progress: SetupProgressService) {}

  @Endpoint(getSetupProgressEndpoint)
  @Requires('campSettings', 'read')
  public get(): Promise<GetSetupProgressResponse> {
    return this.progress.get();
  }
}
