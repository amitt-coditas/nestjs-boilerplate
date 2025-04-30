import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { User } from './entities/user.entity';

import { AbstractRepository } from '../../utils';

@Injectable()
export class UserRepository extends AbstractRepository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }
}
