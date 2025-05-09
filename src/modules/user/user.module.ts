import { Module } from '@nestjs/common';

import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';
import { UserController } from './user.controller';

import { RoleModule } from '../role/role.module';

@Module({
  imports: [RoleModule],
  providers: [UserRepository, UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
