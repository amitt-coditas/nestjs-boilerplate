import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AbstractRepository } from '@utils/index';

import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends AbstractRepository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }
}
