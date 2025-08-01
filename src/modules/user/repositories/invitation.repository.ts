import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AbstractRepository } from '@utils/index';

import { Invitation } from '../entities/invitation.entity';

@Injectable()
export class InvitationRepository extends AbstractRepository<Invitation> {
  constructor(private dataSource: DataSource) {
    super(Invitation, dataSource.createEntityManager());
  }
}
