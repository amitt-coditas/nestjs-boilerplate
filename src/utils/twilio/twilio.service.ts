import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

import { ENV_KEYS, LoggerService } from '@utils/index';

@Injectable()
export class TwilioService {
  private readonly logger: LoggerService;

  private readonly verifyServiceSID: string;
  private readonly twilioPhoneNumber: string;
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
    this.twilioPhoneNumber = this.configService.getOrThrow<string>(
      ENV_KEYS.TWILIO_PHONE_NUMBER,
    );

    this.twilioClient = new Twilio(twilioAccountSID, twilioAuthToken);
  }

  /**
   * Sends an OTP to the user's phone number.
   * @param phoneNumber - The user's phone number to send the OTP to.
   * @returns The verification object.
   */
  async sendOtp(phoneNumber: string): Promise<string> {
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

      return verification.sid;
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
  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
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

      return verificationCheck.valid;
    } catch (error) {
      this.logger.throwServiceError(
        this.verifyOtp.name,
        error,
        'Failed to verify OTP',
      );
    }
  }

  /**
   * Sends an SMS to the user's phone number.
   * @param to - The user's phone number to send the SMS to.
   * @param body - The body of the SMS.
   * @returns The SID of the message.
   */
  async sendSms(to: string, body: string): Promise<string> {
    this.logger.debug(this.sendSms.name, 'Initiating sendSms operation', {
      to,
      body,
    });

    try {
      const message = await this.twilioClient.messages.create({
        from: this.twilioPhoneNumber,
        to,
        body,
      });

      return message.sid;
    } catch (error) {
      this.logger.throwServiceError(
        this.sendSms.name,
        error,
        'Failed to send SMS',
      );
    }
  }
}
