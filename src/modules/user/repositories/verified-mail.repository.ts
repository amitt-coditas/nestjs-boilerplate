import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AbstractRepository } from '@utils/index';

import { VerifiedMail } from '../entities/verified-mail.entity';

@Injectable()
export class VerifiedMailRepository extends AbstractRepository<VerifiedMail> {
  constructor(private dataSource: DataSource) {
    super(VerifiedMail, dataSource.createEntityManager());
  }
}
