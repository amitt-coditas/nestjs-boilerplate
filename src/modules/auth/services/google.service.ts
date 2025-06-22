import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

import {
  InternalServerException,
  UnauthorizedException,
} from '@utils/exceptions';
import { LoggerService } from '@utils/index';

import { SSOVerifyCredsResponseDto } from '../dto/sso-response.dto';

@Injectable()
export class GoogleService {
  private readonly logger: LoggerService;
  private readonly googleAuthClientIds: string[];
  private readonly googleAuthClient: OAuth2Client;

  constructor() {
    this.logger = LoggerService.forClass(this.constructor.name);

    // this.googleAuthClientIds = [
    //   this.configService.getOrThrow(ENV_KEYS.GOOGLE_CLIENT_ID),
    // ].filter(Boolean) as string[];

    // const googleAuthClientSecret = this.configService.getOrThrow<string>(
    //   ENV_KEYS.GOOGLE_CLIENT_SECRET,
    // );

    // this.googleAuthClient = new OAuth2Client({
    //   clientId: this.googleAuthClientIds[0],
    //   clientSecret: googleAuthClientSecret,
    // });
  }

  /**
   * Verifies the provided Google ID token and retrieves the associated user's profile information.
   * @param idToken - The Google ID token to verify.
   * @returns The verified profile information as a SSOVerifyCredsResponseDto.
   * @throws UnauthorizedException if the ID token is invalid.
   * @throws InternalServerException if an error occurs during token verification.
   */
  async verifyCredentials(idToken: string): Promise<SSOVerifyCredsResponseDto> {
    this.logger.debug(
      this.verifyCredentials.name,
      'Initiating verifyCredentials operation',
      { idToken },
    );

    try {
      const tokenInfo = await this.googleAuthClient.verifyIdToken({
        idToken,
        audience: this.googleAuthClientIds,
      });
      const profile = tokenInfo.getPayload();

      if (!profile || !profile.email || !profile.picture) {
        throw new UnauthorizedException(
          'Conflict in verifying Google credentials',
        );
      }

      return {
        ssoId: profile.sub.trim(),
        email: profile.email,
        avatarUrl: profile.picture,
      };
    } catch (error: unknown) {
      this.logger.error(
        this.verifyCredentials.name,
        'Failed to verify credentials',
        { error },
      );
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerException('Failed to verify credentials');
    }
  }
}
