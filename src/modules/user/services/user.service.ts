import { Injectable } from '@nestjs/common';

import { NotFoundException, InternalServerException } from '@utils/exceptions';
import { AbstractService } from '@utils/index';

import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService extends AbstractService<User, UserRepository> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository);
  }

  /**
   * Find one user by email
   * @param email - The email of the user
   * @returns The user
   */
  async findOneByEmail(email: string): Promise<User | undefined> {
    this.logger.debug(this.findOneByEmail.name, 'Finding user by email', {
      email,
    });

    try {
      const user = await this.userRepository.findOneRecord({
        where: { email },
        relations: ['role'],
      });

      return user;
    } catch (error: unknown) {
      this.logger.error(
        this.findOneByEmail.name,
        'Error finding user by email',
        {
          error,
        },
      );
      throw new InternalServerException('Error finding user by email');
    }
  }

  /**
   * Find one user by email
   * @param email - The email of the user
   * @returns The user
   */
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
        relations: ['role'],
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

  /**
   * Find one user by email
   * @param email - The email of the user
   * @returns The user
   */
  async findOneByPhone(phone: string): Promise<User | undefined> {
    this.logger.debug(this.findOneByPhone.name, 'Finding user by phone', {
      phone,
    });

    try {
      const user = await this.userRepository.findOneRecord({
        where: { phone },
        relations: ['role'],
      });

      return user;
    } catch (error: unknown) {
      this.logger.error(
        this.findOneByPhone.name,
        'Error finding user by phone',
        {
          error,
        },
      );
      throw new InternalServerException('Error finding user by phone');
    }
  }

  /**
   * Find one user by phone
   * @param phone - The phone of the user
   * @returns The user
   */
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
        relations: ['role'],
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
