import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AbstractRepository } from '@utils/index';

import { UserMetadata } from '../entities/user-metadata.entity';

@Injectable()
export class UserMetadataRepository extends AbstractRepository<UserMetadata> {
  constructor(private dataSource: DataSource) {
    super(UserMetadata, dataSource.createEntityManager());
  }
}
