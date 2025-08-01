import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Between, LessThan } from 'typeorm';

import { BadRequestException, ConflictException } from '@utils/exceptions';
import {
  AbstractService,
  ENV_KEYS,
  SESService,
  TimeService,
  TIMEZONE,
} from '@utils/index';

import {
  EMAIL_SUPPORT_MESSAGE,
  EMAIL_SUPPORT_SUBJECT,
} from '../constants/email-support.constant';
import { SendEmailSupportRequestDto } from '../dto/send-email-support-request.dto';
import { UserSupportMail } from '../entities/user-support-mail.entity';
import { UserSupportMailRepository } from '../repositories/user-support-mail.repository';

@Injectable()
export class UserSupportMailService extends AbstractService<
  UserSupportMail,
  UserSupportMailRepository
> {
  private readonly sourceMail: string;

  private readonly MAX_TOKENS_PER_DAY = 3;
  private readonly EXPIRE_SUPPORT_MAIL_AFTER_DAYS = 2;

  constructor(
    private readonly configService: ConfigService,
    private readonly timeService: TimeService,
    private readonly sesService: SESService,
    private userSupportMailRepository: UserSupportMailRepository,
  ) {
    super(userSupportMailRepository);
    this.sourceMail = this.configService.getOrThrow<string>(
      ENV_KEYS.AWS_SES_SOURCE_MAIL,
    );
  }

  /**
   * Send a support email
   * @param input - The input of the support email
   */
  async sendSupportEmail(
    input: SendEmailSupportRequestDto,
  ): Promise<{ status: boolean; message: string }> {
    this.logger.debug(this.sendSupportEmail.name, 'Sending support email', {
      ...input,
    });

    try {
      const { email, body } = input;

      const hasExceededLimit = await this.hasExceededDailyLimit(email);
      if (hasExceededLimit) {
        throw new BadRequestException(
          'Daily support email limit exceeded. Please try again tomorrow.',
        );
      }

      const messageId = await this.sesService.sendMail(
        this.sourceMail,
        EMAIL_SUPPORT_SUBJECT(email),
        EMAIL_SUPPORT_MESSAGE(email, body),
      );
      if (!messageId) {
        throw new ConflictException(
          'Error sending support email via Email Service',
        );
      }

      await this.create({
        email,
      });

      return {
        status: !!messageId,
        message: 'Your email has been sent successfully.',
      };
    } catch (error) {
      this.logger.throwServiceError(
        this.sendSupportEmail.name,
        error,
        'Error sending support email',
      );
    }
  }

  /**
   * Handle expired support mails
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleSupportMails() {
    this.logger.debug(this.handleSupportMails.name, 'Handling support mails');

    try {
      const BATCH_SIZE = 100;
      let processedCount = 0;
      let hasMore = true;

      const startOfToday = this.timeService.getStartOfDayInUTC(
        TIMEZONE.AMERICA_LOS_ANGELES,
      );
      const expiryDate = new Date(startOfToday);
      expiryDate.setDate(
        expiryDate.getDate() - this.EXPIRE_SUPPORT_MAIL_AFTER_DAYS,
      );

      while (hasMore) {
        const { records: expiredMails } = await this.findMany({
          where: {
            createdAt: LessThan(expiryDate),
          },
          take: BATCH_SIZE,
          skip: processedCount,
        });

        if (expiredMails.length === 0) {
          hasMore = false;
          continue;
        }

        await Promise.all(expiredMails.map((mail) => this.remove(mail)));

        processedCount += expiredMails.length;
        this.logger.debug(
          this.handleSupportMails.name,
          `Processed ${processedCount} expired support mails`,
        );
      }
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.handleSupportMails.name,
        error,
        'Error handling expired support mails',
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

    const count = await this.userSupportMailRepository.count({
      where: {
        email,
        createdAt: Between(startOfToday, endOfToday),
      },
    });

    return count >= this.MAX_TOKENS_PER_DAY;
  }
}
