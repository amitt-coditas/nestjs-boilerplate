import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

import { ENV_KEYS, LoggerService } from '@utils/index';

import { LOGIN_TYPE } from '../../constants/login-type.enum';
import { SocialLoginResponseDto } from '../../dto';
import { SocialLoginService } from '../../types/social-login.types';

@Injectable()
export class GoogleService implements SocialLoginService {
  private readonly logger: LoggerService;
  private readonly googleAuthClientIds: string[];
  private readonly googleAuthClient: OAuth2Client;

  private readonly loginType = LOGIN_TYPE.GOOGLE;

  constructor(private readonly configService: ConfigService) {
    this.logger = LoggerService.forClass(this.constructor.name);

    this.googleAuthClientIds = [
      this.configService.getOrThrow(ENV_KEYS.GOOGLE_CLIENT_ID_WEB),
      this.configService.getOrThrow(ENV_KEYS.GOOGLE_CLIENT_ID_IOS),
      this.configService.getOrThrow(ENV_KEYS.GOOGLE_CLIENT_ID_ANDROID),
    ].filter(Boolean) as string[];

    const googleAuthClientSecret = this.configService.getOrThrow<string>(
      ENV_KEYS.GOOGLE_CLIENT_SECRET,
    );

    this.googleAuthClient = new OAuth2Client({
      clientId: this.googleAuthClientIds[0],
      clientSecret: googleAuthClientSecret,
    });
  }

  /**
   * Verifies the provided Google ID token and retrieves the associated user's profile information.
   * @param idToken - The Google ID token to verify.
   * @returns The verified profile information as a TokenPayload.
   * @throws ConflictException if token payload is invalid.
   */
  async verifyCredentials(idToken: string): Promise<SocialLoginResponseDto> {
    this.logger.debug(
      this.verifyCredentials.name,
      'Initiating Google credentials verification operation',
      { idToken },
    );

    try {
      const tokenInfo = await this.googleAuthClient.verifyIdToken({
        idToken,
        audience: this.googleAuthClientIds,
      });
      const profile = tokenInfo.getPayload();
      if (!profile || !profile.email || !profile.picture) {
        throw new ConflictException('Conflict in verifying Google credentials');
      }

      return {
        loginType: this.loginType,
        fname: profile.given_name || '',
        lname: profile.family_name || '',
        email: profile.email,
        profilePicture: profile.picture,
      };
    } catch (error: unknown) {
      this.logger.throwServiceError(
        this.verifyCredentials.name,
        error,
        'Failed to verify Google credentials',
      );
    }
  }
}
