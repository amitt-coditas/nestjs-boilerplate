import { Module } from '@nestjs/common';

import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

import { RoleModule } from '../role/role.module';

@Module({
  imports: [RoleModule],
  providers: [UserRepository, UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
