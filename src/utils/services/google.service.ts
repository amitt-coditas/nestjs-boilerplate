import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

import { ENV_KEYS } from '../config/config.module';
import { InternalServerErrorException } from '../exceptions/internal-server-error.exception';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class GoogleService {
  private readonly fileName = GoogleService.name;
  private readonly googleAuthClientIds: string[];
  private readonly googleAuthClient: OAuth2Client;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.googleAuthClientIds = [
      this.configService.getOrThrow(ENV_KEYS.GOOGLE_CLIENT_ID_1),
      this.configService.getOrThrow(ENV_KEYS.GOOGLE_CLIENT_ID_IOS_D),
      this.configService.getOrThrow(ENV_KEYS.GOOGLE_CLIENT_ID_IOS_Q),
      this.configService.getOrThrow(ENV_KEYS.GOOGLE_CLIENT_ID_IOS_P),
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
   * @param {string} idToken - The Google ID token to verify.
   * @returns {Promise<TokenPayload>} - The verified profile information as a TokenPayload.
   * @throws {InternalServerErrorException} - If an error occurs during token verification.
   */
  async verifyGoogleCredentials(idToken: string) {
    this.logger.debug(
      this.fileName,
      this.verifyGoogleCredentials.name,
      'Initiating verifyGoogleCredentials operation',
      { idToken },
    );

    try {
      const tokenInfo = await this.googleAuthClient.verifyIdToken({
        idToken,
        audience: this.googleAuthClientIds,
      });
      const profile = tokenInfo.getPayload();
      return profile as TokenPayload;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.verifyGoogleCredentials.name,
        'Failed to verify Google credentials',
        error,
      );
      throw new InternalServerErrorException();
    }
  }
}
