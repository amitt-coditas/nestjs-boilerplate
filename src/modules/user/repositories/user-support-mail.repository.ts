import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AbstractRepository } from '@utils/index';

import { UserSupportMail } from '../entities/user-support-mail.entity';

@Injectable()
export class UserSupportMailRepository extends AbstractRepository<UserSupportMail> {
  constructor(private dataSource: DataSource) {
    super(UserSupportMail, dataSource.createEntityManager());
  }
}
