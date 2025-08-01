import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IsNull, LessThan, MoreThan } from 'typeorm';

import { AbstractService, IRemoveResponse } from '@utils/index';

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

  /**
   * Gets an active token by access token
   * @param accessToken - The access token
   * @returns The active token
   */
  async getActiveTokenByAccessToken(
    accessToken: string,
  ): Promise<UserToken | undefined> {
    this.logger.debug(
      this.getActiveTokenByAccessToken.name,
      'Getting active token by access token',
      {
        accessToken,
      },
    );

    try {
      const userToken = await this.findOne({
        where: {
          accessToken,
          deletedAt: IsNull(),
          accessTokenExpiry: MoreThan(new Date()),
        },
        relations: ['user', 'user.role'],
      });

      return userToken;
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.getActiveTokenByAccessToken.name,
        error,
        `Error getting active token by access token ${accessToken}`,
      );
    }
  }

  /**
   * Logs out a user by removing their access token
   * @param accessToken - The access token to logout
   * @returns A boolean indicating the success of the logout operation
   */
  async logout(accessToken: string): Promise<IRemoveResponse> {
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
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.logout.name,
        error,
        `Error logging out with access token ${accessToken}`,
      );
    }
  }

  /**
   * Handle expired tokens every week
   */
  @Cron(CronExpression.EVERY_WEEK)
  async handleExpiredTokens() {
    this.logger.debug(this.handleExpiredTokens.name, 'Handling expired tokens');

    try {
      const batchSize = 100;
      let processedCount = 0;

      while (true) {
        const { records: expiredTokens } = await this.findMany({
          where: { refreshTokenExpiry: LessThan(new Date()) },
          take: batchSize,
        });

        if (expiredTokens.length === 0) {
          break;
        }

        await Promise.all(expiredTokens.map((token) => this.remove(token)));
        processedCount += expiredTokens.length;

        this.logger.debug(
          this.handleExpiredTokens.name,
          `Processed ${processedCount} expired tokens`,
        );

        if (expiredTokens.length < batchSize) {
          break;
        }
      }

      this.logger.debug(
        this.handleExpiredTokens.name,
        `Completed processing ${processedCount} expired tokens`,
      );
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.handleExpiredTokens.name,
        error,
        'Error handling expired tokens',
      );
    }
  }
}
