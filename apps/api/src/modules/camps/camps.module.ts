import { Module } from '@nestjs/common';

import { CampService } from './camp/services/camp.service.ts';

@Module({
  providers: [CampService],
  exports: [CampService],
})
export class CampsModule {}
