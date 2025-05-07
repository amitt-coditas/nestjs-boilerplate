import { Injectable } from '@nestjs/common';

import { RoleService } from '../modules/role/role.service';

@Injectable()
export class AppService {
  constructor(private readonly roleService: RoleService) {}

  async onModuleInit() {
    await this.roleService.populateRolesInDB();
  }

  healthCheck(): string {
    return 'HEALTH CHECK: OK';
  }
}
