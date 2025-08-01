import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AbstractRepository } from '@utils/index';

import { UserOtps } from '../entities/user-otp.entity';

@Injectable()
export class UserOtpRepository extends AbstractRepository<UserOtps> {
  constructor(private dataSource: DataSource) {
    super(UserOtps, dataSource.createEntityManager());
  }
}
