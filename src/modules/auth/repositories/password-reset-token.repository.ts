import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AbstractRepository } from '@utils/index';

import { PasswordResetToken } from '../entities/password-reset-token.entity';

@Injectable()
export class PasswordResetTokenRepository extends AbstractRepository<PasswordResetToken> {
  constructor(private readonly dataSource: DataSource) {
    super(PasswordResetToken, dataSource.createEntityManager());
  }
}
