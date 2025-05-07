import { Module } from '@nestjs/common';

import { UserMetadataRepository } from './repositories/user-metadata.repository';
import { UserRepository } from './repositories/user.repository';
import { UserMetadataService } from './services/user-metadata.service';
import { UserService } from './services/user.service';
import { UserController } from './user.controller';

import { RoleModule } from '../role/role.module';

@Module({
  imports: [RoleModule],
  providers: [
    UserRepository,
    UserService,
    UserMetadataRepository,
    UserMetadataService,
  ],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
