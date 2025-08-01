import { Injectable } from '@nestjs/common';

import { BadRequestException, NotFoundException } from '@utils/exceptions';
import { AbstractService } from '@utils/index';

import { SocialLoginResponseDto } from 'src/modules/auth/dto/social-login-response.dto';

import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService extends AbstractService<User, UserRepository> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository);
  }

  /**
   * Find a user by id
   * @param id - The id of the user
   * @returns The user
   * @throws NotFoundException if user is not found
   */
  override async findOneByIdOrThrow(id: string): Promise<User> {
    this.logger.debug(this.findOneByIdOrThrow.name, 'Finding user by id', {
      id,
    });

    try {
      const user = await this.repository.findOneRecord({
        where: { id },
        relations: ['role'],
      });
      if (!user) throw new NotFoundException(this.tableName);

      return user;
    } catch (error) {
      this.logger.throwServiceError(
        this.findOneByIdOrThrow.name,
        error,
        'Error finding user by id',
      );
    }
  }

  /**
   * Find a user by id
   * @param id - The id of the user
   * @returns The user
   */
  override async findOneById(id: string): Promise<User | undefined> {
    this.logger.debug(this.findOneById.name, 'Finding user by id', {
      id,
    });

    try {
      const user = await this.repository.findOneRecord({
        where: { id },
        relations: ['role'],
      });
      if (!user) return undefined;

      return user;
    } catch (error) {
      this.logger.throwServiceError(
        this.findOneById.name,
        error,
        'Error finding user by id',
      );
    }
  }

  /**
   * Find a user by email
   * @param email - The email of the user
   * @returns The user
   * @throws NotFoundException if user is not found
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
      const user = await this.repository.findOneRecord({
        where: { email },
        relations: ['role'],
      });
      if (!user) throw new NotFoundException(this.tableName);

      return user;
    } catch (error) {
      this.logger.throwServiceError(
        this.findOneOrThrowByEmail.name,
        error,
        'Error finding user by email',
      );
    }
  }

  /**
   * Find a user by email
   * @param email - The email of the user
   * @returns The user
   */
  async findOneByEmail(email: string): Promise<User | undefined> {
    this.logger.debug(this.findOneByEmail.name, 'Finding user by email', {
      email,
    });

    try {
      const user = await this.repository.findOneRecord({
        where: { email },
        relations: ['role'],
      });
      if (!user) return undefined;

      return user;
    } catch (error) {
      this.logger.throwServiceError(
        this.findOneByEmail.name,
        error,
        'Error finding user by email',
      );
    }
  }

  /**
   * Find a user by phone
   * @param phone - The phone of the user
   * @returns The user
   * @throws NotFoundException if user is not found
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
      const user = await this.repository.findOneRecord({
        where: { phone },
        relations: ['role'],
      });
      if (!user) throw new NotFoundException(this.tableName);

      return user;
    } catch (error) {
      this.logger.throwServiceError(
        this.findOneOrThrowByPhone.name,
        error,
        'Error finding user by phone',
      );
    }
  }

  /**
   * Find a user by phone
   * @param phone - The phone of the user
   * @returns The user
   */
  async findOneByPhone(phone: string): Promise<User | undefined> {
    this.logger.debug(this.findOneByPhone.name, 'Finding user by phone', {
      phone,
    });

    try {
      const user = await this.repository.findOneRecord({
        where: { phone },
        relations: ['role'],
      });
      if (!user) return undefined;

      return user;
    } catch (error) {
      this.logger.throwServiceError(
        this.findOneByPhone.name,
        error,
        'Error finding user by phone',
      );
    }
  }

  /**
   * Find a user by email or phone
   * @param emailOrPhone - The email or phone of the user
   * @returns The user
   * @throws NotFoundException if user is not found
   */
  async findUserByEmailOrPhone(emailOrPhone: string): Promise<User> {
    this.logger.debug(
      this.findUserByEmailOrPhone.name,
      'Finding user by email or phone',
      {
        emailOrPhone,
      },
    );

    try {
      this.validateEmailPhoneFormat(emailOrPhone);

      const user = this.validateEmailFormat(emailOrPhone)
        ? await this.repository.findOneRecord({
            where: { email: emailOrPhone },
            relations: ['role'],
          })
        : await this.repository.findOneRecord({
            where: { phone: emailOrPhone },
            relations: ['role'],
          });

      if (!user) throw new NotFoundException(this.tableName);

      return user;
    } catch (error) {
      this.logger.throwServiceError(
        this.findUserByEmailOrPhone.name,
        error,
        'Error finding user by email or phone',
      );
    }
  }

  /**
   * Find or create a user via social login
   * @param userData - The user data
   * @returns The user
   */
  async findOrCreateUserViaSocialLogin(
    input: SocialLoginResponseDto,
  ): Promise<User> {
    this.logger.debug(
      this.findOrCreateUserViaSocialLogin.name,
      'Finding or creating user via social login',
      { input },
    );

    try {
      const user = await this.findOneByEmail(input.email);
      if (user) {
        if (input.profilePicture) {
          await this.update(user, {
            profilePicture: input.profilePicture,
          });
        }

        return user;
      }

      const newUserEntity = this.repository.create({
        email: input.email,
        emailVerified: true,
        fname: input.fname,
        lname: input.lname,
        profilePicture: input.profilePicture,
      });

      const savedNewUser = await this.repository.save(newUserEntity);

      return savedNewUser;
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.findOrCreateUserViaSocialLogin.name,
        error,
        'Error finding or creating user via social login',
      );
    }
  }

  /**
   * Validate the email or phone format
   * @param emailOrPhone - The email or phone of the user
   * @returns True if the email or phone is valid, false otherwise
   */
  validateEmailPhoneFormat(emailOrPhone: string): boolean {
    const isEmailOrPhoneValid =
      this.validateEmailFormat(emailOrPhone) ||
      this.validatePhoneFormat(emailOrPhone);

    if (!isEmailOrPhoneValid) {
      throw new BadRequestException('Invalid email or phone format');
    }

    return isEmailOrPhoneValid;
  }

  /**
   * Validate the phone format
   * @param phone - The phone of the user
   * @returns True if the phone is valid, false otherwise
   */
  validatePhoneFormat(phone: string): boolean {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;

    return phoneRegex.test(phone);
  }

  /**
   * Validate the email format
   * @param emailOrPhone - The email or phone of the user
   * @returns True if the email is valid, false otherwise
   */
  validateEmailFormat(emailOrPhone: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(emailOrPhone);
  }
}
