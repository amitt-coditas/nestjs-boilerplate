import { Module } from '@nestjs/common';

import { RoleRepository } from './role.repository';
import { RoleService } from './role.service';

@Module({
  providers: [RoleRepository, RoleService],
  exports: [RoleService],
})
export class RoleModule {}
