import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Role } from './entities/role.entity';

import { AbstractRepository } from '../../utils';

@Injectable()
export class RoleRepository extends AbstractRepository<Role> {
  constructor(private dataSource: DataSource) {
    super(Role, dataSource.createEntityManager());
  }
}
