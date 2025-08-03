import { randomBytes } from 'crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Between, LessThan, MoreThan } from 'typeorm';

import { BadRequestException } from '@utils/exceptions';
import {
  AbstractService,
  BaseMessageResponseDto,
  ENV_KEYS,
  SESService,
  TimeService,
  TIMEZONE,
  TwilioService,
} from '@utils/index';

import { User } from '../../user/entities/user.entity';
import { UserService } from '../../user/services/user.service';
import {
  EMAIL_OTP_MESSAGE,
  EMAIL_OTP_SUBJECT,
} from '../constants/email-otp.constant';
import { OTP_MEDIUM, OTP_PURPOSE } from '../constants/otp.enum';
import { GenerateOtpDto, VerifyEmailOtpDto, VerifySmsOtpDto } from '../dto';
import { UserOtps } from '../entities/user-otp.entity';
import { UserOtpRepository } from '../repositories/user-otp.repository';

@Injectable()
export class UserOtpService extends AbstractService<
  UserOtps,
  UserOtpRepository
> {
  private readonly feBaseUrl: string;

  private readonly otpPurpose = OTP_PURPOSE.FORGOT_PASSWORD;
  private readonly MAX_OTP_LENGTH = 6;
  private readonly MAX_OTP_PER_HOUR = 5;
  private readonly VALID_FOR_MINUTES = 10;

  constructor(
    private readonly configService: ConfigService,
    private readonly timeService: TimeService,
    private readonly sesService: SESService,
    private readonly twilioService: TwilioService,
    private readonly userOtpRepository: UserOtpRepository,
    private readonly userService: UserService,
  ) {
    super(userOtpRepository);

    this.feBaseUrl = configService.getOrThrow<string>(ENV_KEYS.FE_BASE_URL);
  }

  /**
   * Generate an OTP for a user
   * @param input - The input object containing the email or phone number
   * @param user - The user object
   * @returns The OTP and valid till date
   */
  async generateOtp(
    input: GenerateOtpDto,
    user: User,
  ): Promise<BaseMessageResponseDto> {
    this.logger.debug(this.generateOtp.name, 'Generating OTP', input);

    try {
      this.userService.validateEmailPhoneFormat(input.emailOrPhone);

      const isEmail = this.userService.validateEmailFormat(input.emailOrPhone);

      const { otp, validTill } = this.buildOtpAndValidTill(
        this.MAX_OTP_LENGTH,
        'minutes',
        this.VALID_FOR_MINUTES,
      );

      let messageId: string | undefined;
      if (isEmail) {
        if (user.emailVerified) {
          throw new BadRequestException('Email already verified');
        }
        if (user.email !== input.emailOrPhone) {
          throw new BadRequestException('Incorrect email entered');
        }

        const hasExceededLimit = await this.hasExceededDailyLimitAndUpdate(
          input.emailOrPhone,
        );
        if (hasExceededLimit) {
          throw new BadRequestException('Hourly OTP limit exceeded');
        }

        messageId = await this.sesService.sendMail(
          input.emailOrPhone,
          EMAIL_OTP_SUBJECT,
          EMAIL_OTP_MESSAGE(otp, input.emailOrPhone),
        );

        if (messageId) {
          await this.create({
            otp,
            validTill,
            purpose: this.otpPurpose,
            messageId,
            user,
          });
        }
      } else {
        if (user.phoneVerified) {
          throw new BadRequestException('Phone already verified');
        }
        if (user.phone !== input.emailOrPhone) {
          throw new BadRequestException('Incorrect phone number entered');
        }

        messageId = await this.twilioService.sendOtp(input.emailOrPhone);
      }

      if (!messageId) {
        throw new BadRequestException('Failed to send OTP');
      }

      return {
        status: true,
        message: 'OTP sent successfully',
        meta: {
          medium: isEmail ? OTP_MEDIUM.EMAIL : OTP_MEDIUM.SMS,
        },
      };
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.generateOtp.name,
        error,
        `Error generating OTP for ${input.emailOrPhone}`,
      );
    }
  }

  /**
   * Verify an SMS OTP
   * @param input - The input object containing the phone number and OTP
   * @returns A message response indicating the status of the verification
   */
  async verifySmsOtp(
    input: VerifySmsOtpDto,
    user: User,
  ): Promise<BaseMessageResponseDto> {
    this.logger.debug(this.verifySmsOtp.name, 'Verifying OTP', input);

    try {
      const status = await this.twilioService.verifyOtp(input.phone, input.otp);

      if (!status) {
        throw new BadRequestException('Invalid or Expired OTP');
      }
      if (user.phone !== input.phone) {
        throw new BadRequestException('This OTP is not for your phone number');
      }

      await this.userService.update(user, {
        phoneVerified: true,
      });

      return {
        status: true,
        message: 'OTP verified successfully',
      };
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.verifySmsOtp.name,
        error,
        `Error verifying OTP for ${input.phone}`,
      );
    }
  }

  /**
   * Verify an Email OTP
   * @param input - The input object containing the email and OTP
   * @param user - The user object
   * @returns A message response indicating the status of the verification
   */
  async verifyEmailOtp(
    input: VerifyEmailOtpDto,
    user: User,
  ): Promise<BaseMessageResponseDto> {
    this.logger.debug(this.verifyEmailOtp.name, 'Verifying OTP', input);

    try {
      const userOtp = await this.findOne({
        where: {
          user: { email: input.email },
          otp: input.otp,
          purpose: this.otpPurpose,
          validTill: MoreThan(new Date()),
        },
        order: {
          createdAt: 'DESC',
        },
      });
      if (!userOtp) {
        throw new BadRequestException('Invalid or Expired OTP');
      }
      if (user.email !== input.email) {
        throw new BadRequestException('This OTP is not for your email');
      }

      await this.update(userOtp, { isUsed: true });
      await this.userService.update(user, {
        emailVerified: true,
      });

      return {
        status: true,
        message: 'OTP verified successfully',
      };
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.verifyEmailOtp.name,
        error,
        `Error verifying OTP for ${input.email}`,
      );
    }
  }

  /**
   * Build OTP and valid till date
   * @param otpLength - The length of the OTP
   * @param validForPeriod - The period for which the OTP is valid
   * @param validForPeriodValue - The value of the period
   * @returns The OTP and valid till date
   */
  buildOtpAndValidTill(
    otpLength: number,
    validForPeriod: 'minutes' | 'days',
    validForPeriodValue: number,
  ): { otp: string; validTill: Date } {
    const otp = randomBytes(otpLength).toString('hex').toUpperCase();

    const validTill = new Date();
    if (validForPeriod === 'minutes') {
      validTill.setMinutes(validTill.getMinutes() + validForPeriodValue);
    } else {
      validTill.setDate(validTill.getDate() + validForPeriodValue);
    }

    return {
      otp,
      validTill,
    };
  }

  private async hasExceededDailyLimitAndUpdate(
    email: string,
  ): Promise<boolean> {
    this.logger.debug(
      this.hasExceededDailyLimitAndUpdate.name,
      'Checking daily limit',
      {
        email,
      },
    );

    const startOfHour = this.timeService.getStartOfCurrentHourInUTC(
      TIMEZONE.AMERICA_LOS_ANGELES,
    );
    const endOfHour = this.timeService.getEndOfCurrentHourInUTC(
      TIMEZONE.AMERICA_LOS_ANGELES,
    );

    const { records, totalCount } = await this.findMany({
      where: {
        user: { email },
        purpose: this.otpPurpose,
        createdAt: Between(startOfHour, endOfHour),
      },
    });

    for (const record of records) {
      await this.update(record, { isUsed: true });
    }

    return totalCount >= this.MAX_OTP_PER_HOUR;
  }

  /**
   * Handle expired reset password tokens every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredOtps() {
    this.logger.debug(this.handleExpiredOtps.name, 'Handling expired otps');

    try {
      const batchSize = 100;
      let processedCount = 0;

      while (true) {
        const { records: expiredTokens } = await this.findMany({
          where: {
            validTill: LessThan(new Date()),
          },
          take: batchSize,
        });

        if (expiredTokens.length === 0) {
          break;
        }

        await Promise.all(expiredTokens.map((token) => this.remove(token)));
        processedCount += expiredTokens.length;

        this.logger.debug(
          this.handleExpiredOtps.name,
          `Processed ${processedCount} expired otps`,
        );

        if (expiredTokens.length < batchSize) {
          break;
        }
      }

      this.logger.debug(
        this.handleExpiredOtps.name,
        `Completed processing ${processedCount} expired otps`,
      );
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.handleExpiredOtps.name,
        error,
        'Error handling expired otps',
      );
    }
  }
}
