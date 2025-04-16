import { Injectable } from '@nestjs/common';

import { Role } from './entities/role.entity';
import { RoleRepository } from './role.repository';

import { AbstractService } from '../../utils';

@Injectable()
export class RoleService extends AbstractService<Role, RoleRepository> {
  constructor(private readonly roleRepository: RoleRepository) {
    super(roleRepository);
  }
}
