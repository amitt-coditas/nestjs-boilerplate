import { Injectable } from '@nestjs/common';
import { IsNull, MoreThan } from 'typeorm';

import { InternalServerException } from '@utils/exceptions';
import { AbstractService } from '@utils/index';

import { UserToken } from '../entities/user-token.entity';
import { UserTokenRepository } from '../repositories/user-token.repository';

@Injectable()
export class UserTokenService extends AbstractService<
  UserToken,
  UserTokenRepository
> {
  constructor(private readonly userTokenRepository: UserTokenRepository) {
    super(userTokenRepository);
  }

  async getActiveTokenByAccessToken(accessToken: string) {
    return await this.repository.findOneRecord({
      where: {
        accessToken,
        deletedAt: IsNull(),
        accessTokenExpiry: MoreThan(new Date()),
      },
      relations: ['user'],
    });
  }

  /**
   * Logs out a user by removing their access token
   * @param accessToken - The access token to logout
   * @returns A boolean indicating the success of the logout operation
   * @throws InternalServerException if the logout operation fails
   */
  async logout(accessToken: string) {
    this.logger.debug(this.logout.name, 'Logging out with access token', {
      accessToken,
    });

    try {
      const token = await this.findOneOrThrow({
        where: {
          accessToken,
        },
      });

      return await this.remove(token);
    } catch (error) {
      this.logger.error(this.logout.name, 'Failed to logout', error);
      throw new InternalServerException('Failed to logout');
    }
  }
}
