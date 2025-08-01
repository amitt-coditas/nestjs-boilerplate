import { Injectable } from '@nestjs/common';

import { BadRequestException } from '@utils/exceptions';
import { LoggerService } from '@utils/index';

import { AuthService } from './auth.service';
import { AppleService } from './social-login/apple.service';
import { GoogleService } from './social-login/google.service';

import { UserService } from '../../user/services/user.service';
import { LOGIN_TYPE } from '../constants/login-type.enum';
import {
  GenerateTokenDto,
  LoginResponseDto,
  SocialLoginRequestDto,
} from '../dto';
import { SocialLoginService } from '../types/social-login.types';

@Injectable()
export class SocialLoginOrchestrator {
  private readonly logger: LoggerService;

  private readonly providers: Map<LOGIN_TYPE, SocialLoginService>;

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly googleService: GoogleService,
    private readonly appleService: AppleService,
  ) {
    this.logger = LoggerService.forClass(this.constructor.name);

    this.providers = new Map<LOGIN_TYPE, SocialLoginService>([
      [LOGIN_TYPE.GOOGLE, this.googleService],
      [LOGIN_TYPE.APPLE, this.appleService],
    ]);
  }

  /**
   * Handles the social login process
   * @param input - The social login request data
   * @returns The login response data
   */
  async handleSocialLogin(
    input: SocialLoginRequestDto,
  ): Promise<LoginResponseDto> {
    this.logger.debug(this.handleSocialLogin.name, 'Handling social login', {
      input,
    });

    try {
      const provider = this.getProvider(input.loginType);
      const socialUserData = await provider.verifyCredentials(input.idToken);

      const user =
        await this.userService.findOrCreateUserViaSocialLogin(socialUserData);

      const generateTokenData: GenerateTokenDto = {
        loginType: input.loginType,
        latitude: input.latitude,
        longitude: input.longitude,
        deviceId: input.deviceId,
        os: input.os,
        user,
      };

      return this.authService.login(generateTokenData);
    } catch (error) {
      this.logger.throwServiceError(
        this.handleSocialLogin.name,
        error,
        `Error handling social login for login type ${input.loginType} with idToken ${input.idToken}`,
      );
    }
  }

  private getProvider(loginType: LOGIN_TYPE): SocialLoginService {
    const provider = this.providers.get(loginType);
    if (!provider) {
      throw new BadRequestException(`Unsupported login type: ${loginType}`);
    }

    return provider;
  }
}
