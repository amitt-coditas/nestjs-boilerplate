import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

import { ENV_KEYS } from '../config/config.module';
import { InternalServerErrorException } from '../exceptions/internal-server-error.exception';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class TwilioService {
  private readonly fileName = TwilioService.name;
  private readonly verifyServiceSID: string;
  private readonly twilioClient: Twilio;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    const twilioAccountSID = this.configService.getOrThrow<string>(
      ENV_KEYS.TWILIO_ACCOUNT_SID,
    );
    const twilioAuthToken = this.configService.getOrThrow<string>(
      ENV_KEYS.TWILIO_AUTH_TOKEN,
    );
    this.verifyServiceSID = this.configService.getOrThrow<string>(
      ENV_KEYS.VERIFY_SERVICE_SID,
    );

    this.twilioClient = new Twilio(twilioAccountSID, twilioAuthToken);
  }

  /**
   * Sends an OTP to the user's phone number.
   * @param {string} phoneNumber - The user's phone number to send the OTP to.
   * @throws {BadRequestException | NotFoundException | InternalServerErrorException} - If the OTP sending fails.
   */
  async sendOtp(phoneNumber: string) {
    this.logger.debug(
      this.fileName,
      this.sendOtp.name,
      'Initiating sendOtp operation',
      { phoneNumber },
    );

    try {
      const verification = await this.twilioClient.verify.v2
        .services(this.verifyServiceSID)
        .verifications.create({
          channel: 'sms',
          to: phoneNumber,
        });

      return verification;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.sendOtp.name,
        'Failed to send OTP',
        error,
      );
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw error;
    }
  }

  /**
   * Verifies the OTP provided by the user.
   * @param {VerifyOtpDto} verifyOtpDto - Contains the user's phone number and OTP code.
   * @throws {BadRequestException | NotFoundException | InternalServerErrorException} - If OTP verification fails.
   */
  async verifyOtp(phoneNumber: string, otp: string) {
    this.logger.debug(
      this.fileName,
      this.verifyOtp.name,
      'Initiating verifyOtp operation',
      { phoneNumber, otp },
    );

    try {
      const verificationCheck = await this.twilioClient.verify.v2
        .services(this.verifyServiceSID)
        .verificationChecks.create({
          code: otp,
          to: phoneNumber,
        });
      if (verificationCheck.valid === false) {
        throw new BadRequestException('Invalid or Expired OTP');
      }
      return verificationCheck;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.verifyOtp.name,
        'Failed to verify OTP',
        error,
      );
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Invalid OTP, Please Retry!');
    }
  }
}
