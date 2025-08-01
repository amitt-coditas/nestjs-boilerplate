import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan, MoreThan } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { NotFoundException } from '@utils/exceptions';
import { AbstractService } from '@utils/index';

import { UserSession } from '../entities/user-session.entity';
import { UserSessionRepository } from '../repositories/user-session.repository';

@Injectable()
export class UserSessionService extends AbstractService<
  UserSession,
  UserSessionRepository
> {
  private readonly SESSION_EXPIRATION_TIME_HOURS = 2;

  constructor(private readonly userSessionRepository: UserSessionRepository) {
    super(userSessionRepository);
  }

  /**
   * Find a user session by session ID
   * @param sessionId - The session ID
   * @returns The user session
   */
  async findOneBySessionIdOrThrow(sessionId: string): Promise<UserSession> {
    this.logger.debug(
      this.findOneBySessionIdOrThrow.name,
      'Finding user session by session ID',
      {
        sessionId,
      },
    );

    try {
      const userSession = await this.userSessionRepository.findOneRecord({
        where: { sessionId },
      });

      if (!userSession) throw new NotFoundException(this.tableName);

      return userSession;
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.findOneBySessionIdOrThrow.name,
        error,
        'Error finding user session by session ID',
      );
    }
  }

  /**
   * Generate a session ID
   * @param prevSessionId - The previous session ID
   * @returns The session ID and valid till
   */
  async generateSessionId(
    prevSessionId: string | undefined,
  ): Promise<{ sessionId: string; validTill: Date }> {
    this.logger.debug(this.generateSessionId.name, 'Generating session ID', {
      prevSessionId,
    });

    try {
      if (prevSessionId) {
        const userSession = await this.findOne({
          where: {
            sessionId: prevSessionId,
            validTill: MoreThan(new Date()),
          },
        });
        if (userSession)
          return {
            sessionId: userSession.sessionId,
            validTill: userSession.validTill,
          };
      }

      const sessionId = uuid();
      const currentTime = new Date();
      const validTillHours =
        currentTime.getHours() + this.SESSION_EXPIRATION_TIME_HOURS;
      const validTill = new Date(currentTime.setHours(validTillHours));

      await this.create({
        sessionId,
        validTill,
      });

      return {
        sessionId,
        validTill,
      };
    } catch (error) {
      this.logger.throwServiceError(
        this.generateSessionId.name,
        error,
        'Failed to generate session ID',
      );
    }
  }

  /**
   * Handle expired sessions every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredSessions() {
    this.logger.debug(
      this.handleExpiredSessions.name,
      'Handling expired sessions',
    );

    try {
      const batchSize = 100;
      let processedCount = 0;

      while (true) {
        const { records: expiredSessions } = await this.findMany({
          where: { validTill: LessThan(new Date()) },
          take: batchSize,
        });

        if (expiredSessions.length === 0) {
          break;
        }

        await Promise.all(
          expiredSessions.map((session) => this.remove(session)),
        );
        processedCount += expiredSessions.length;

        this.logger.debug(
          this.handleExpiredSessions.name,
          `Processed ${processedCount} expired sessions`,
        );

        if (expiredSessions.length < batchSize) {
          break;
        }
      }

      this.logger.debug(
        this.handleExpiredSessions.name,
        `Completed processing ${processedCount} expired sessions`,
      );
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.handleExpiredSessions.name,
        error,
        'Error handling expired sessions',
      );
    }
  }
}
