import { randomBytes } from 'crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan, MoreThan, Between } from 'typeorm';

import { BadRequestException } from '@utils/exceptions';
import {
  AbstractService,
  ENV_KEYS,
  SESService,
  TimeService,
  TIMEZONE,
} from '@utils/index';

import { VerifiedMailService } from './verified-mail.service';

import {
  EMAIL_INVITATION_MESSAGE,
  EMAIL_INVITATION_SUBJECT,
} from '../constants/email-invitation.constant';
import { CreateInvitationTokenResponseDto } from '../dto/create-invitation-token-response.dto';
import { Invitation } from '../entities/invitation.entity';
import { InvitationRepository } from '../repositories/invitation.repository';

@Injectable()
export class InvitationService extends AbstractService<
  Invitation,
  InvitationRepository
> {
  private readonly feBaseUrl: string;

  private readonly VALID_FOR_DAYS = 7;
  private readonly MAX_TOKENS_PER_DAY = 3;

  constructor(
    private readonly configService: ConfigService,
    private readonly timeService: TimeService,
    private readonly sesService: SESService,
    private readonly invitationRepository: InvitationRepository,
    private readonly verifiedMailService: VerifiedMailService,
  ) {
    super(invitationRepository);

    this.feBaseUrl = configService.getOrThrow<string>(ENV_KEYS.FE_BASE_URL);
  }

  /**
   * Create a token for a user
   * @param email - The email of the user
   * @returns The token
   */
  async sendInvitationToken(
    email: string,
  ): Promise<CreateInvitationTokenResponseDto> {
    this.logger.debug(
      this.sendInvitationToken.name,
      'Sending invitation token',
    );

    try {
      const verifiedMail = await this.verifiedMailService.findOne({
        where: { email, verified: true },
      });
      if (!verifiedMail || !verifiedMail.email) {
        throw new BadRequestException(
          'Email not verified. Kindly contact Admin.',
        );
      }

      const hasExceededLimit = await this.hasExceededDailyLimit(email);
      if (hasExceededLimit) {
        throw new BadRequestException(
          'Daily token generation limit exceeded. Please try again tomorrow.',
        );
      }

      const token = randomBytes(4).toString('hex').toUpperCase();
      const validTill = new Date();
      validTill.setDate(validTill.getDate() + this.VALID_FOR_DAYS);
      const url = `${this.feBaseUrl}/?invite=${token}`;

      const messageId = await this.sesService.sendMail(
        email,
        EMAIL_INVITATION_SUBJECT,
        EMAIL_INVITATION_MESSAGE(url),
      );
      if (!messageId) {
        throw new BadRequestException('Error sending mail');
      }

      await this.create({
        token,
        validTill,
        verifiedMail,
      });

      return {
        token,
        validTill,
      };
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.sendInvitationToken.name,
        error,
        'Error sending invitation token',
      );
    }
  }

  /**
   * Check if a token is valid
   * @param token - The token
   * @returns True if the token is valid, false otherwise
   */
  async checkValidToken(token: string): Promise<boolean> {
    this.logger.debug(this.checkValidToken.name, 'Checking valid token', {
      token,
    });
    try {
      const invitation = await this.findOne({
        where: {
          token,
          validTill: MoreThan(new Date()),
        },
      });

      return !!invitation;
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.checkValidToken.name,
        error,
        'Error checking valid token',
      );
    }
  }

  /**
   * Handle expired invitations
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredInvitations() {
    this.logger.debug(
      this.handleExpiredInvitations.name,
      'Handling expired invitations',
    );

    try {
      const BATCH_SIZE = 100;
      let processedCount = 0;
      let hasMore = true;

      while (hasMore) {
        const { records: expiredInvitations } = await this.findMany({
          where: {
            validTill: LessThan(new Date()),
          },
          take: BATCH_SIZE,
          skip: processedCount,
        });

        if (expiredInvitations.length === 0) {
          hasMore = false;
          continue;
        }

        await Promise.all(
          expiredInvitations.map((invitation) => this.remove(invitation)),
        );

        processedCount += expiredInvitations.length;
        this.logger.debug(
          this.handleExpiredInvitations.name,
          `Processed ${processedCount} expired invitations`,
        );
      }
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.handleExpiredInvitations.name,
        error,
        'Error handling expired invitations',
      );
    }
  }

  private async hasExceededDailyLimit(email: string): Promise<boolean> {
    this.logger.debug(this.hasExceededDailyLimit.name, 'Checking daily limit', {
      email,
    });

    const startOfToday = this.timeService.getStartOfDayInUTC(
      TIMEZONE.AMERICA_LOS_ANGELES,
    );
    const endOfToday = this.timeService.getEndOfDayInUTC(
      TIMEZONE.AMERICA_LOS_ANGELES,
    );

    const count = await this.invitationRepository.count({
      where: {
        verifiedMail: { email },
        createdAt: Between(startOfToday, endOfToday),
      },
    });

    return count >= this.MAX_TOKENS_PER_DAY;
  }
}
