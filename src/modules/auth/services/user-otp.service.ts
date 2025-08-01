import { Injectable } from '@nestjs/common';

import {
  AbstractService,
  SESService,
  TimeService,
  TwilioService,
} from '@utils/index';

import { UserService } from '../../user/services/user.service';
import { OTP_MEDIUM } from '../constants/otp.enum';
import { UserOtps } from '../entities/user-otp.entity';
import { UserOtpRepository } from '../repositories/user-otp.repository';

@Injectable()
export class UserOtpService extends AbstractService<
  UserOtps,
  UserOtpRepository
> {
  private readonly MAX_OTP_LENGTH = 6;
  private readonly MAX_OTP_PER_DAY = 5;
  private readonly VALID_FOR_MINUTES = 10;

  constructor(
    private readonly timeService: TimeService,
    private readonly sesService: SESService,
    private readonly twilioService: TwilioService,
    private readonly userOtpRepository: UserOtpRepository,
    private readonly userService: UserService,
  ) {
    super(userOtpRepository);
  }

  isEmailOrPhone(emailOrPhone: string) {
    const isEmail = this.userService.validateEmailFormat(emailOrPhone);
    if (isEmail) {
      return OTP_MEDIUM.EMAIL;
    }

    return OTP_MEDIUM.SMS;
  }

  // async generateOtp(input: GenerateOtpDto): Promise<UserOtps> {
  //   this.logger.debug(this.generateOtp.name, 'Generating OTP', input);

  //   try {
  //   } catch (error: unknown) {
  //     this.logger.throwServiceError(
  //       this.generateOtp.name,
  //       error,
  //       `Error generating OTP for ${input.emailOrPhone}`,
  //     );
  //   }
  // }
}
