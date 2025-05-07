import { Injectable } from '@nestjs/common';

import { AbstractService } from '@utils/index';

import { UserMetadata } from '../entities/user-metadata.entity';
import { UserMetadataRepository } from '../repositories/user-metadata.repository';

@Injectable()
export class UserMetadataService extends AbstractService<
  UserMetadata,
  UserMetadataRepository
> {
  constructor(private readonly userMetadataRepository: UserMetadataRepository) {
    super(userMetadataRepository);
  }
}
