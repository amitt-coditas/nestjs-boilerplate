import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { compare, hash } from 'bcrypt';
import { Between, DeepPartial, LessThan, MoreThan } from 'typeorm';

import { BadRequestException } from '@utils/exceptions';
import {
  BaseMessageResponseDto,
  ENV_KEYS,
  LoggerService,
  SESService,
  TimeService,
  TIMEZONE,
  TwilioService,
} from '@utils/index';

import { UserOtpService } from './user-otp.service';

import { User } from '../../user/entities/user.entity';
import { UserService } from '../../user/services/user.service';
import {
  EMAIL_FORGOT_PASSWORD_MESSAGE,
  EMAIL_FORGOT_PASSWORD_SUBJECT,
  SMS_FORGOT_PASSWORD_MESSAGE,
} from '../constants/email-forgot-password.constant';
import { OTP_PURPOSE } from '../constants/otp.enum';
import {
  GenerateOtpDto,
  GeneratePasswordDto,
  ResetPasswordDto,
  ResetForgotPasswordDto,
} from '../dto';
import { UserOtps } from '../entities/user-otp.entity';

@Injectable()
export class PasswordService {
  private readonly logger: LoggerService;

  private readonly feBaseUrl: string;

  private readonly otpPurpose = OTP_PURPOSE.FORGOT_PASSWORD;
  private readonly MAX_TOKEN_LENGTH = 6;
  private readonly MAX_TOKENS_PER_DAY = 3;
  private readonly VALID_FOR_MINUTES = 30;

  constructor(
    private readonly configService: ConfigService,
    private readonly timeService: TimeService,
    private readonly sesService: SESService,
    private readonly twilioService: TwilioService,
    private readonly userService: UserService,
    private readonly userOtpService: UserOtpService,
  ) {
    this.logger = LoggerService.forClass(this.constructor.name);

    this.feBaseUrl = configService.getOrThrow<string>(ENV_KEYS.FE_BASE_URL);
  }

  /**
   * Forgot password
   * @param input - The input of the forgot password
   * @returns The response of the forgot password
   */
  async forgotPassword(input: GenerateOtpDto): Promise<BaseMessageResponseDto> {
    this.logger.debug(this.forgotPassword.name, 'Forgot password', input);

    const { emailOrPhone } = input;

    try {
      const user = await this.userService.findUserByEmailOrPhone(emailOrPhone);
      const isEmail = this.userService.validateEmailFormat(emailOrPhone);

      const hasExceededLimit = await this.hasExceededDailyLimitAndUpdate(user);
      if (hasExceededLimit) {
        throw new BadRequestException(
          'Daily password reset limit exceeded. Please try again tomorrow.',
        );
      }

      const { otp: token, validTill } =
        this.userOtpService.buildOtpAndValidTill(
          this.MAX_TOKEN_LENGTH,
          'minutes',
          this.VALID_FOR_MINUTES,
        );
      const url = `${this.feBaseUrl}/reset-password?token=${token}`;

      const userOtpEntity: DeepPartial<UserOtps> = {
        otp: token,
        validTill,
        purpose: this.otpPurpose,
        user,
      };

      let messageId: string | undefined;
      if (isEmail) {
        messageId = await this.sesService.sendMail(
          user.email,
          EMAIL_FORGOT_PASSWORD_SUBJECT,
          EMAIL_FORGOT_PASSWORD_MESSAGE(url, user.fname),
        );
      } else {
        messageId = await this.twilioService.sendSms(
          user.phone,
          SMS_FORGOT_PASSWORD_MESSAGE(url, user.fname),
        );
      }

      if (!messageId) {
        throw new BadRequestException('Error sending mail');
      }

      userOtpEntity.messageId = messageId;
      await this.userOtpService.create(userOtpEntity);

      return {
        status: true,
        message: 'Password reset email sent',
      };
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.forgotPassword.name,
        error,
        'Error forgot password',
      );
    }
  }

  /**
   * Reset forgot password
   * @param token - The token of the reset password
   * @param input - The input of the reset password
   * @returns The response of the reset forgot password
   */
  async resetForgotPassword(
    token: string,
    input: ResetForgotPasswordDto,
  ): Promise<BaseMessageResponseDto> {
    this.logger.debug(this.resetForgotPassword.name, 'Reset forgot password', {
      token,
      input,
    });

    try {
      const resetPasswordToken = await this.userOtpService.findOne({
        where: {
          otp: token,
          validTill: MoreThan(new Date()),
          isUsed: false,
        },
      });
      if (!resetPasswordToken) {
        throw new BadRequestException(
          'Invalid or expired password reset token',
        );
      }

      const newPassword = await this.hashPassword(input.password);

      await this.userService.update(resetPasswordToken.user, {
        password: newPassword,
      });

      await this.userOtpService.update(resetPasswordToken, { isUsed: true });

      return {
        status: true,
        message: 'Password reset successfully',
      };
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.resetForgotPassword.name,
        error,
        'Error reset forgot password',
      );
    }
  }

  /**
   * Generate password
   * @param input - The input of the generate password
   * @param user - The user of the generate password
   * @returns The response of the generate password
   */
  async generatePassword(
    input: GeneratePasswordDto,
    user: User,
  ): Promise<BaseMessageResponseDto> {
    this.logger.debug(this.generatePassword.name, 'Generate password', {
      input,
      user,
    });

    try {
      const newPassword = await this.hashPassword(input.password);

      await this.userService.update(user, {
        password: newPassword,
      });

      return {
        status: true,
        message: 'Password generated successfully',
      };
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.generatePassword.name,
        error,
        'Error generate password',
      );
    }
  }

  /**
   * Reset password
   * @param input - The input of the reset password
   * @param user - The user of the reset password
   * @returns The response of the reset password
   */
  async resetPassword(
    input: ResetPasswordDto,
    user: User,
  ): Promise<BaseMessageResponseDto> {
    this.logger.debug(this.resetPassword.name, 'Reset password', {
      input,
      user,
    });

    try {
      const isPasswordMatching = await this.comparePassword(
        input.oldPassword,
        user.password,
      );
      if (!isPasswordMatching) {
        throw new BadRequestException('Old password does not match');
      }

      const newPassword = await this.hashPassword(input.newPassword);

      await this.userService.update(user, {
        password: newPassword,
      });

      return {
        status: true,
        message: 'Password reset successfully',
      };
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.resetPassword.name,
        error,
        'Error reset password',
      );
    }
  }

  /**
   * Hash password
   * @param password - The password to hash
   * @returns The hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return await hash(password, 10);
  }

  /**
   * Compare password
   * @param password - The password to compare
   * @param hashedPassword - The hashed password to compare
   * @returns The result of the comparison
   */
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await compare(password, hashedPassword);
  }

  private async hasExceededDailyLimitAndUpdate(user: User): Promise<boolean> {
    this.logger.debug(
      this.hasExceededDailyLimitAndUpdate.name,
      'Checking daily limit',
      {
        userId: user.id,
      },
    );

    const startOfToday = this.timeService.getStartOfDayInUTC(
      TIMEZONE.AMERICA_LOS_ANGELES,
    );
    const endOfToday = this.timeService.getEndOfDayInUTC(
      TIMEZONE.AMERICA_LOS_ANGELES,
    );

    const { records, totalCount } = await this.userOtpService.findMany({
      where: {
        user: { id: user.id },
        createdAt: Between(startOfToday, endOfToday),
      },
    });

    for (const record of records) {
      await this.userOtpService.update(record, { isUsed: true });
    }

    return totalCount >= this.MAX_TOKENS_PER_DAY;
  }

  /**
   * Handle expired reset password tokens every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredResetPasswordTokens() {
    this.logger.debug(
      this.handleExpiredResetPasswordTokens.name,
      'Handling expired reset password tokens',
    );

    try {
      const batchSize = 100;
      let processedCount = 0;

      while (true) {
        const { records: expiredTokens } = await this.userOtpService.findMany({
          where: {
            validTill: LessThan(new Date()),
          },
          take: batchSize,
        });

        if (expiredTokens.length === 0) {
          break;
        }

        await Promise.all(
          expiredTokens.map((token) => this.userOtpService.remove(token)),
        );
        processedCount += expiredTokens.length;

        this.logger.debug(
          this.handleExpiredResetPasswordTokens.name,
          `Processed ${processedCount} expired reset password tokens`,
        );

        if (expiredTokens.length < batchSize) {
          break;
        }
      }

      this.logger.debug(
        this.handleExpiredResetPasswordTokens.name,
        `Completed processing ${processedCount} expired reset password tokens`,
      );
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.handleExpiredResetPasswordTokens.name,
        error,
        'Error handling expired reset password tokens',
      );
    }
  }
}
