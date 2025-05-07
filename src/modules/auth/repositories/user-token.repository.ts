import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AbstractRepository } from '@utils/index';

import { UserToken } from '../entities/user-token.entity';

@Injectable()
export class UserTokenRepository extends AbstractRepository<UserToken> {
  constructor(private dataSource: DataSource) {
    super(UserToken, dataSource.createEntityManager());
  }
}
