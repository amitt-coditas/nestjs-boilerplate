import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

import { BadRequestException, ConflictException } from '@utils/exceptions';
import { ENV_KEYS, LoggerService } from '@utils/index';

@Injectable()
export class TwilioService {
  private readonly logger: LoggerService;

  private readonly verifyServiceSID: string;
  private readonly twilioClient: Twilio;

  constructor(private readonly configService: ConfigService) {
    this.logger = LoggerService.forClass(this.constructor.name);

    const twilioAccountSID = this.configService.getOrThrow<string>(
      ENV_KEYS.TWILIO_ACCOUNT_SID,
    );
    const twilioAuthToken = this.configService.getOrThrow<string>(
      ENV_KEYS.TWILIO_AUTH_TOKEN,
    );
    this.verifyServiceSID = this.configService.getOrThrow<string>(
      ENV_KEYS.TWILIO_VERIFY_SERVICE_SID,
    );

    this.twilioClient = new Twilio(twilioAccountSID, twilioAuthToken);
  }

  /**
   * Sends an OTP to the user's phone number.
   * @param phoneNumber - The user's phone number to send the OTP to.
   * @returns The verification object.
   */
  async sendOtp(phoneNumber: string) {
    this.logger.debug(this.sendOtp.name, 'Initiating sendOtp operation', {
      phoneNumber,
    });

    try {
      const verification = await this.twilioClient.verify.v2
        .services(this.verifyServiceSID)
        .verifications.create({
          channel: 'sms',
          to: phoneNumber,
        });
      if (!verification || !verification.sid)
        throw new ConflictException('Error sending OTP. Please try again!');

      return verification;
    } catch (error) {
      this.logger.throwServiceError(
        this.sendOtp.name,
        error,
        'Failed to send OTP',
      );
    }
  }

  /**
   * Verifies the OTP provided by the user.
   * @param phoneNumber - The user's phone number to verify the OTP for.
   * @param otp - The OTP to verify.
   * @returns The verification check object.
   */
  async verifyOtp(phoneNumber: string, otp: string) {
    this.logger.debug(this.verifyOtp.name, 'Initiating verifyOtp operation', {
      phoneNumber,
      otp,
    });

    try {
      const verificationCheck = await this.twilioClient.verify.v2
        .services(this.verifyServiceSID)
        .verificationChecks.create({
          code: otp,
          to: phoneNumber,
        });

      if (verificationCheck.valid === false)
        throw new BadRequestException('Invalid or Expired OTP');

      return verificationCheck;
    } catch (error) {
      this.logger.throwServiceError(
        this.verifyOtp.name,
        error,
        'Failed to verify OTP',
      );
    }
  }
}
