import { Injectable } from '@nestjs/common';

import { Role } from './entities/role.entity';
import { RoleRepository } from './role.repository';

import { AbstractService } from '../../utils';

@Injectable()
export class RoleService extends AbstractService<Role, RoleRepository> {
  constructor(private readonly roleRepository: RoleRepository) {
    super(roleRepository);
  }

  onModuleInit() {
    this.logger.debug(this.onModuleInit.name, 'ONE RoleService initialized');
    this.logger.debug(this.onModuleInit.name, 'TWO RoleService initialized');

    this.createRole();
  }

  createRole() {
    this.logger.debug(this.createRole.name, 'Creating role', {
      name: 'ADMIN',
    });
  }
}
