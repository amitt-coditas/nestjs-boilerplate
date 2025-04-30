import { Injectable } from '@nestjs/common';

import { User } from './entities/user.entity';
import { UserRepository } from './user.repository';

import { AbstractService } from '../../utils';
import { RoleService } from '../role/role.service';

@Injectable()
export class UserService extends AbstractService<User, UserRepository> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleService: RoleService,
  ) {
    super(userRepository);
  }

  onModuleInit() {
    this.logger.debug(this.onModuleInit.name, 'ONE UserService initialized');
    this.logger.debug(this.onModuleInit.name, 'TWO UserService initialized');

    this.createUser();
  }

  createUser() {
    this.logger.debug(this.createUser.name, 'Creating user', {
      fname: 'John',
      lname: 'Doe',
      email: 'john.doe@example.com',
    });
  }
}
