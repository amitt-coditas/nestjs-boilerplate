import { Injectable } from '@nestjs/common';

import { NotFoundException, InternalServerException } from '@utils/exceptions';
import { AbstractService } from '@utils/index';

import { RoleService } from '../../role/role.service';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService extends AbstractService<User, UserRepository> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleService: RoleService,
  ) {
    super(userRepository);
  }

  async findOneOrThrowByEmail(email: string): Promise<User> {
    this.logger.debug(
      this.findOneOrThrowByEmail.name,
      'Finding user by email',
      {
        email,
      },
    );

    try {
      const user = await this.userRepository.findOneRecord({
        where: { email },
      });

      if (!user) {
        throw new NotFoundException(this.tableName);
      }

      return user;
    } catch (error) {
      this.logger.error(
        this.findOneOrThrowByEmail.name,
        'Error finding user by email',
        error,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerException('Error finding user by email');
    }
  }

  async findOneOrThrowByPhone(phone: string): Promise<User> {
    this.logger.debug(
      this.findOneOrThrowByPhone.name,
      'Finding user by phone',
      {
        phone,
      },
    );

    try {
      const user = await this.userRepository.findOneRecord({
        where: { phone },
      });

      if (!user) {
        throw new NotFoundException(this.tableName);
      }

      return user;
    } catch (error) {
      this.logger.error(
        this.findOneOrThrowByPhone.name,
        'Error finding user by phone',
        error,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerException('Error finding user by phone');
    }
  }
}
