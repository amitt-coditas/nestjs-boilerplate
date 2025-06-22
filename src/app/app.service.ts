import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}

  async onModuleInit() {
    // TODO: Uncomment this when the roles are ready
    // await this.roleService.populateRolesInDB();
  }

  healthCheck(): string {
    return 'HEALTH CHECK: OK';
  }
}
