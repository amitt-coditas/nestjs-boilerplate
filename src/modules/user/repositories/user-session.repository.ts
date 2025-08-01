import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AbstractRepository } from '@utils/index';

import { UserSession } from '../entities/user-session.entity';

@Injectable()
export class UserSessionRepository extends AbstractRepository<UserSession> {
  constructor(private dataSource: DataSource) {
    super(UserSession, dataSource.createEntityManager());
  }
}
