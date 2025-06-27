import { randomBytes } from 'crypto';

// eslint-disable-next-line import/no-unresolved

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { hash } from 'bcrypt';
import { LessThan } from 'typeorm';

import {
  BadRequestException,
  InternalServerException,
  NotFoundException,
} from '@utils/exceptions';
import {
  AbstractService,
  BaseMessageResponseDto,
  ENV_KEYS,
  SESService,
} from '@utils/index';

import { UserService } from 'src/modules/user/services/user.service';

import {
  PASSWORD_RESET_MESSAGE,
  PASSWORD_RESET_SUBJECT,
} from '../constants/password-reset.constants';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/password-reset.dto';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { PasswordResetTokenRepository } from '../repositories/password-reset-token.repository';

@Injectable()
export class PasswordResetTokenService extends AbstractService<
  PasswordResetToken,
  PasswordResetTokenRepository
> {
  private readonly feBaseUrl: string;

  private readonly VALID_FOR_MINUTES = 30;

  constructor(
    private readonly configService: ConfigService,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly userService: UserService,
    private readonly sesService: SESService,
  ) {
    super(passwordResetTokenRepository);

    this.feBaseUrl = this.configService.getOrThrow<string>(
      ENV_KEYS.FE_BASE_URL,
    );
  }

  /**
   * Forgot password by email
   * @param email - The email of the user
   * @returns The message response
   */
  async forgotPassword(
    input: ForgotPasswordDto,
  ): Promise<BaseMessageResponseDto> {
    const { email } = input;

    this.logger.debug(this.forgotPassword.name, 'Forgot password by email', {
      email,
    });

    try {
      const user = await this.userService.findOneByEmail(email);
      if (!user) {
        throw new NotFoundException('User');
      }

      const token = randomBytes(4).toString('hex').toUpperCase();
      const url = `${this.feBaseUrl}/reset-password?token=${token}`;
      const validTill = new Date();
      validTill.setMinutes(validTill.getMinutes() + this.VALID_FOR_MINUTES);

      const { id: passwordResetTokenId } = await this.create({
        token,
        validTill,
        user,
      });

      if (passwordResetTokenId) {
        const messageId = await this.sesService.sendMailFromSpecificSource(
          email,
          PASSWORD_RESET_SUBJECT,
          PASSWORD_RESET_MESSAGE({
            firstName: user.fname,
            resetUrl: url,
            period: 'minute(s)',
            duration: this.VALID_FOR_MINUTES,
          }),
        );
        if (!messageId) {
          throw new BadRequestException(
            `Error sending mail to the user ${email} to reset password`,
          );
        }
      }

      return {
        status: true,
        message: `Mail sent to the user email ${email} to reset password`,
      };
    } catch (error: unknown) {
      this.logger.error(this.forgotPassword.name, 'Error forgot password', {
        error,
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerException('Error forgot password');
    }
  }

  /**
   * Reset password
   * @param input - The input
   * @returns The message response
   */
  async resetPassword(
    input: ResetPasswordDto,
  ): Promise<BaseMessageResponseDto> {
    const { token, newPassword } = input;

    this.logger.debug(this.resetPassword.name, 'Reset password', {
      token,
    });

    try {
      const passwordResetToken = await this.findOneOrThrow({
        where: {
          token,
        },
        relations: ['user'],
      });

      const newPasswordHash = await hash(newPassword, 10);

      await this.userService.update(passwordResetToken.user, {
        password: newPasswordHash,
      });
      await this.update(passwordResetToken, { isUsed: true });

      return {
        status: true,
        message: 'Password reset successfully',
      };
    } catch (error: unknown) {
      this.logger.error(this.resetPassword.name, 'Error reset password', {
        error,
      });
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerException('Error reset password');
    }
  }

  /**
   * Validate password reset token
   * @param token - The token
   * @returns The password reset token
   */
  async validatePasswordResetToken(token: string): Promise<PasswordResetToken> {
    const passwordResetToken = await this.findOne({
      where: {
        token,
      },
      relations: ['user'],
    });
    if (!passwordResetToken) {
      throw new NotFoundException('Password reset token');
    }
    if (passwordResetToken.validTill < new Date()) {
      throw new BadRequestException(
        'Your link to reset your password has expired',
      );
    }
    if (passwordResetToken.isUsed) {
      throw new BadRequestException(
        'Your link to reset your password has already been used',
      );
    }

    return passwordResetToken;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredPasswordResetTokens() {
    this.logger.debug(
      this.handleExpiredPasswordResetTokens.name,
      'Handle expired password reset tokens',
    );

    try {
      const BATCH_SIZE = 100;
      let processedCount = 0;
      let hasMore = true;

      while (hasMore) {
        const expiredPasswordResetTokens = await this.findMany({
          where: {
            validTill: LessThan(new Date()),
          },
          take: BATCH_SIZE,
          skip: processedCount,
        });

        if (expiredPasswordResetTokens.length === 0) {
          hasMore = false;
          continue;
        }

        await Promise.all(
          expiredPasswordResetTokens.map((passwordResetToken) =>
            this.remove(passwordResetToken),
          ),
        );

        processedCount += expiredPasswordResetTokens.length;
        this.logger.debug(
          this.handleExpiredPasswordResetTokens.name,
          `Processed ${processedCount} expired password reset tokens`,
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        this.handleExpiredPasswordResetTokens.name,
        'Error handling expired invitations',
        {
          error,
        },
      );
      throw new InternalServerException('Error handling expired invitations');
    }
  }
}
